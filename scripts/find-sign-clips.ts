/**
 * Find YouTube reference clips for curriculum items via the YouTube Data API v3.
 *
 *   node scripts/find-sign-clips.ts [--unit 1] [--force] [--refresh]
 *
 * Caching (no API calls when nothing is new):
 *   - The app never calls the API: it embeds the video ids committed in signClips.ts.
 *   - Items that already have candidates are skipped; --force redoes them (and discards their picks).
 *   - The channel index is cached in scripts/.cache/ (gitignored) for 30 days; --refresh refetches it.
 *
 * Needs YOUTUBE_API_KEY in .env (server-side only; never VITE_-prefixed). It must be a standard API key (starts with
 * "AIza"); other Google credential types get a 401 "API keys are not supported".
 *
 * How it picks:
 *   1. Index the uploads of a few ASL dictionary channels (one short single-sign video per gloss) and match titles
 *      exactly ("Hello ASL", "Learn How to Sign Hello in ASL", ...). playlistItems.list costs 1 unit per 50 videos,
 *      so the whole index is ~700 units.
 *   2. Only items no channel has fall back to search.list (100 units each). Plain search ranks whole-alphabet videos,
 *      "common mistakes" videos and kids' songs first, so it's a last resort.
 *   The free tier is 10,000 units/day.
 *
 * Writes:
 *   src/domain/signClipCandidates.json  up to 5 candidates per item (channel, title, seconds) for review
 *   src/domain/signClips.ts             the chosen clip per item (first candidate, whole video)
 *
 * Picks in signClips.ts can be hand-edited (videoId/start/end); a rerun keeps existing picks unless --force.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createServer } from "vite";

const ROOT = resolve(import.meta.dirname, "..");
const CANDIDATES = resolve(ROOT, "src/domain/signClipCandidates.json");
const CLIPS = resolve(ROOT, "src/domain/signClips.ts");
const API = "https://www.googleapis.com/youtube/v3";
const MAX_CANDIDATES = 5;
const INDEX_CACHE = resolve(ROOT, "scripts/.cache/channel-index.json");
const INDEX_MAX_AGE_MS = 30 * 24 * 3600 * 1000;

type Item = { kind: "sign"; gloss: string } | { kind: "letter"; char: string } | { kind: "number"; value: number };
type Candidate = { videoId: string; title: string; channel: string; seconds: number };
type Clip = { videoId: string; start: number; end: number };
type Upload = { videoId: string; title: string; channel: string };

/**
 * Dictionary channels in preference order. `core` pulls the gloss out of a title (lowercased), or null when the title
 * isn't a single-sign entry. ASL Interactive comes first: it covers nearly all of Unit 1 with 4–6 s clips by one signer.
 */
const CHANNELS: { name: string; uploads: string; core: (t: string) => string | null }[] = [
  { name: "ASL Interactive", uploads: "UUU9J6ekXu_W3KM4VaK2Hpfw", core: (t) => /^(.+?) asl$/.exec(t)?.[1] ?? null },
  {
    name: "Learn How to Sign",
    uploads: "UUy15oRYzbP4yeiDDAIxuC9A",
    core: (t) => /^learn how to sign (.+?) in asl\b/.exec(t)?.[1] ?? null,
  },
  { name: "Start ASL", uploads: "UUI1HHPBLTdA0TOFwcfQqsIA", core: (t) => /^(.+?) in asl$/.exec(t)?.[1] ?? null },
  {
    name: "ASLTutorSean",
    uploads: "UUxAHcLNhKTQfQaQJw46678g",
    core: (t) => /^asl sign for (.+?) [/|] learn asl/.exec(t)?.[1] ?? null,
  },
  { name: "The ASL Shop", uploads: "UULcwyLCw0MQCsTPWsryDGiA", core: (t) => /^(.+?) \| asl glossary/.exec(t)?.[1] ?? null },
  // Gloss-only titles ("SQUARE"); exact match only, so phrases and variants ("SKATEBOARD feet on board") never match.
  { name: "Signs", uploads: "UUZy9xs6Tn9vWqN_5l0EEIZA", core: (t) => t },
];

const NUMBER_WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
  "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty"];

function args() {
  const a = process.argv.slice(2);
  const i = a.indexOf("--unit");
  return { unit: i >= 0 ? Number(a[i + 1]) : 1, force: a.includes("--force"), refresh: a.includes("--refresh") };
}

function apiKey(): string {
  if (process.env.YOUTUBE_API_KEY) return process.env.YOUTUBE_API_KEY;
  const env = resolve(ROOT, ".env");
  if (existsSync(env)) {
    const line = readFileSync(env, "utf8").split("\n").find((l) => l.startsWith("YOUTUBE_API_KEY="));
    const v = line?.slice("YOUTUBE_API_KEY=".length).trim().replace(/^["']|["']$/g, "");
    if (v) return v;
  }
  throw new Error("Set YOUTUBE_API_KEY in .env");
}

/** Title cores that count as this item, e.g. sign THANK-YOU → "thank you"; letter A → "a", "letter a"; 7 → "7", "seven". */
function names(item: Item): string[] {
  if (item.kind === "letter") return [item.char.toLowerCase(), `letter ${item.char.toLowerCase()}`];
  if (item.kind === "number") return [String(item.value), `number ${item.value}`, NUMBER_WORDS[item.value]].filter(Boolean);
  const w = item.gloss.toLowerCase().replace(/['’]/g, "").replace(/-/g, " ");
  return [...new Set([w, w.replace(/ /g, "-"), item.gloss.toLowerCase()])];
}

/** Fallback search text, e.g. `"thank you" ASL sign`, `letter A ASL fingerspelling`, `number 7 ASL sign`. */
function query(item: Item): string {
  if (item.kind === "sign") return `"${names(item)[0]}" ASL sign`;
  if (item.kind === "letter") return `letter ${item.char} ASL fingerspelling`;
  return `number ${item.value} ASL sign`;
}

/** ISO 8601 duration (PT1M5S) → seconds. */
function seconds(iso: string): number {
  const m = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(iso);
  return m ? Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0) : 0;
}

class FatalApiError extends Error {}

let units = 0;
async function get(path: string, params: Record<string, string>, key: string, cost: number) {
  units += cost;
  const url = `${API}/${path}?${new URLSearchParams({ ...params, key })}`;
  const res = await fetch(url);
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    // never echo the URL: it carries the key
    const msg = `${path} ${res.status}: ${body}`;
    // bad key or exhausted quota: every further request would fail the same way
    if ([400, 401, 403].includes(res.status)) throw new FatalApiError(msg);
    throw new Error(msg);
  }
  return res.json();
}

/** The channel index, cached on disk (gitignored) so later units and reruns don't refetch it. */
async function indexChannels(key: string, refresh: boolean): Promise<Map<string, Upload[]>> {
  if (!refresh && existsSync(INDEX_CACHE)) {
    const cached = JSON.parse(readFileSync(INDEX_CACHE, "utf8")) as { fetchedAt: string; byCore: [string, Upload[]][] };
    if (Date.now() - Date.parse(cached.fetchedAt) < INDEX_MAX_AGE_MS) {
      console.log(`channel index: cached ${cached.fetchedAt.slice(0, 10)} (--refresh to refetch)`);
      return new Map(cached.byCore);
    }
  }
  const byCore = await fetchIndex(key);
  mkdirSync(dirname(INDEX_CACHE), { recursive: true });
  writeFileSync(INDEX_CACHE, JSON.stringify({ fetchedAt: new Date().toISOString(), byCore: [...byCore] }));
  return byCore;
}

async function fetchIndex(key: string): Promise<Map<string, Upload[]>> {
  const byCore = new Map<string, Upload[]>();
  for (const ch of CHANNELS) {
    let page: string | undefined;
    let n = 0;
    do {
      const r = await get(
        "playlistItems",
        { part: "snippet", playlistId: ch.uploads, maxResults: "50", ...(page ? { pageToken: page } : {}) },
        key,
        1,
      );
      for (const it of r.items as { snippet: { title: string; resourceId: { videoId: string } } }[]) {
        const core = ch.core(it.snippet.title.toLowerCase().replace(/[“”"]/g, "").trim())?.replace(/[?!.]/g, "").trim();
        if (!core) continue;
        const list = byCore.get(core) ?? [];
        list.push({ videoId: it.snippet.resourceId.videoId, title: it.snippet.title, channel: ch.name });
        byCore.set(core, list);
        n++;
      }
      page = r.nextPageToken;
    } while (page);
    console.log(`indexed ${ch.name.padEnd(18)} ${n} entries`);
  }
  return byCore;
}

/** Durations for embeddable videos only; others are dropped. */
async function details(ids: string[], key: string): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  for (let i = 0; i < ids.length; i += 50) {
    const v = await get("videos", { part: "contentDetails,status", id: ids.slice(i, i + 50).join(",") }, key, 1);
    for (const x of v.items as { id: string; contentDetails: { duration: string }; status: { embeddable: boolean } }[])
      if (x.status.embeddable) out.set(x.id, seconds(x.contentDetails.duration));
  }
  return out;
}

async function search(item: Item, key: string): Promise<Upload[]> {
  const s = await get(
    "search",
    {
      part: "snippet",
      q: query(item),
      type: "video",
      videoEmbeddable: "true",
      videoDuration: "short", // < 4 minutes
      safeSearch: "strict",
      relevanceLanguage: "en",
      maxResults: "3",
    },
    key,
    100,
  );
  return (s.items as { id: { videoId: string }; snippet: { title: string; channelTitle: string } }[]).map((i) => ({
    videoId: i.id.videoId,
    title: i.snippet.title,
    channel: i.snippet.channelTitle,
  }));
}

function readJson<T>(path: string, fallback: T): T {
  return existsSync(path) ? (JSON.parse(readFileSync(path, "utf8")) as T) : fallback;
}

/** Existing picks from signClips.ts, so hand edits survive reruns. */
function readPicks(): Record<string, Clip> {
  if (!existsSync(CLIPS)) return {};
  const m = /SIGN_CLIPS[^=]*=\s*(\{[\s\S]*\});?\s*$/.exec(readFileSync(CLIPS, "utf8"));
  try {
    return m ? (JSON.parse(m[1]) as Record<string, Clip>) : {};
  } catch {
    return {};
  }
}

function writePicks(picks: Record<string, Clip>) {
  const sorted = Object.fromEntries(Object.entries(picks).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(
    CLIPS,
    `// Generated by scripts/find-sign-clips.ts; picks may be hand-edited (videoId/start/end in seconds).\n` +
      `// Keys are itemKey() values. Candidates for review: signClipCandidates.json.\n` +
      `import type { Clip } from "./signContent";\n\n` +
      `export const SIGN_CLIPS: Partial<Record<string, Clip>> = ${JSON.stringify(sorted, null, 2)};\n`,
  );
}

async function main() {
  const { unit, force, refresh } = args();
  const key = apiKey();

  // Load the real curriculum through Vite so extensionless TS imports resolve.
  const vite = await createServer({ root: ROOT, logLevel: "error", server: { middlewareMode: true }, appType: "custom" });
  let items: Map<string, Item>;
  try {
    const { UNITS } = await vite.ssrLoadModule("/src/domain/curriculum.ts");
    const { itemKey } = await vite.ssrLoadModule("/src/domain/signContent.ts");
    const u = (UNITS as { id: number; lessons: { items: Item[] }[] }[]).find((x) => x.id === unit);
    if (!u) throw new Error(`No unit ${unit}`);
    items = new Map();
    for (const l of u.lessons) for (const it of l.items) items.set(itemKey(it), it);
  } finally {
    await vite.close();
  }

  const candidates = readJson<Record<string, Candidate[]>>(CANDIDATES, {});
  const picks = force ? {} : readPicks();
  const todo = [...items].filter(([k]) => force || !candidates[k]?.length);

  if (todo.length > 0) {
    const index = await indexChannels(key, refresh);
    const found = new Map<string, Upload[]>();
    for (const [k, item] of todo) {
      const seen = new Set<string>();
      const hits = names(item)
        .flatMap((n) => index.get(n) ?? [])
        .sort((a, b) => CHANNELS.findIndex((c) => c.name === a.channel) - CHANNELS.findIndex((c) => c.name === b.channel))
        .filter((u) => !seen.has(u.videoId) && seen.add(u.videoId));
      found.set(k, hits);
    }
    for (const [k, item] of todo) {
      if (found.get(k)!.length > 0) continue;
      try {
        found.set(k, await search(item, key));
        console.log(`${k.padEnd(20)} searched (${query(item)})`);
      } catch (e) {
        console.error(`${k}: ${(e as Error).message}`);
        if (e instanceof FatalApiError) {
          console.error("Stopped: the API rejected the key or quota is used up.");
          break;
        }
      }
    }
    const durations = await details([...new Set([...found.values()].flat().map((u) => u.videoId))], key);
    for (const [k, hits] of found) {
      candidates[k] = hits
        .filter((u) => durations.has(u.videoId))
        .slice(0, MAX_CANDIDATES)
        .map((u) => ({ ...u, seconds: durations.get(u.videoId)! }));
    }
  }

  for (const [k] of items) {
    const top = candidates[k]?.[0];
    if (!picks[k] && top) picks[k] = { videoId: top.videoId, start: 0, end: top.seconds };
  }

  writeFileSync(CANDIDATES, JSON.stringify(candidates, null, 2) + "\n");
  writePicks(picks);
  const missing = [...items.keys()].filter((k) => !picks[k]);
  const sources = new Map<string, number>();
  for (const [k] of items) {
    const ch = candidates[k]?.find((c) => c.videoId === picks[k]?.videoId)?.channel ?? "hand-picked";
    if (picks[k]) sources.set(ch, (sources.get(ch) ?? 0) + 1);
  }
  console.log(`\n~${units} quota units. ${items.size - missing.length}/${items.size} picked.`);
  for (const [ch, n] of sources) console.log(`  ${ch}: ${n}`);
  if (missing.length) console.log(`No clip: ${missing.join(", ")}`);
}

main().catch((e) => {
  console.error((e as Error).message);
  process.exit(1);
});
