import { IconTrash } from "@tabler/icons-react";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ReferenceClips } from "../../features/devtest/components/ReferenceClips";
import { trainCount } from "../../features/devtest/referenceClips";
import { UNITS } from "../../domain/curriculum";
import { allowedFor, dedupe } from "../../domain/lessonPlan";
import { itemKey, itemLabel } from "../../domain/signContent";
import { useAuth } from "../../hooks/useAuth";
import { isRecognizable, useRecognizer, type AttemptPhase, type AttemptResult, type DominantHand, type Item } from "../../recognition";
import { glossKey, signLabels } from "../../recognition/vocab";

/** Every item the current model knows, by kind: the pool for "vs all of its kind". */
const ALL_OF_KIND: Record<Item["kind"], Item[]> = {
  sign: [...new Set(signLabels.map(glossKey))].sort().map((gloss): Item => ({ kind: "sign", gloss })),
  letter: [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"].map((char): Item => ({ kind: "letter", char })).filter(isRecognizable),
  number: Array.from({ length: 10 }, (_, value): Item => ({ kind: "number", value })).filter(isRecognizable),
};

/** Units shown in the picker. Unit 1 only for now; widen as more units get tested. */
const TEST_UNITS = UNITS.filter((u) => u.id === 1);

/** Every word on the page: the reference clip index keeps only these. */
const TEST_WORDS: Item[] = dedupe(TEST_UNITS.flatMap((u) => u.lessons.flatMap((l) => l.items)));

/** Regular lessons only: quizzes and reviews just repeat their lessons' words. */
const LESSONS_BY_UNIT = new Map(TEST_UNITS.map((u) => [u.id, u.lessons.filter((l) => l.kind === "lesson")]));

const name = (i: Item | null) => (i ? itemLabel(i) : "—");

type Mode = "lesson" | "kind" | "target";
const MODES: Record<Mode, string> = { lesson: "vs lesson", kind: "vs all of its kind", target: "target only" };

type Search = { unit: number; lesson?: string; word?: string; mode: Mode };

const PHASE_BADGE: Record<AttemptPhase, string> = {
  waiting: "badge-ghost",
  recording: "badge-error",
  processing: "badge-warning",
};
const VERDICT_BADGE: Record<AttemptResult["verdict"], string> = {
  correct: "badge-success",
  wrong: "badge-error",
  rejected: "badge-neutral",
};

let nextRow = 0;
interface Row {
  id: number;
  expect: Item;
  mode: Mode;
  r: AttemptResult;
}

function RecognizerDemo() {
  const { user } = useAuth();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const { status, error, start, stop, attempt } = useRecognizer();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hand, setHand] = useState<DominantHand>(user?.dominantHand ?? "right");
  const [phase, setPhase] = useState<AttemptPhase | null>(null);
  const [rows, setRows] = useState<Row[]>([]);

  const lessons = LESSONS_BY_UNIT.get(search.unit) ?? LESSONS_BY_UNIT.get(TEST_UNITS[0].id)!;
  const lesson = lessons.find((l) => l.id === search.lesson) ?? lessons[0];
  const words = useMemo(() => dedupe(lesson.items), [lesson]);
  const expect = words.find((w) => itemKey(w) === search.word && isRecognizable(w)) ?? words.find(isRecognizable) ?? null;
  const mode = search.mode;

  const set = (patch: Partial<Search>) => navigate({ search: (s) => ({ ...s, ...patch }), replace: true });

  const allowed = useMemo(() => {
    if (!expect || mode === "target") return undefined;
    return mode === "lesson" ? allowedFor(expect, words) : ALL_OF_KIND[expect.kind];
  }, [expect, mode, words]);

  useEffect(() => {
    if (videoRef.current) start(videoRef.current, { dominantHand: hand, overlay: canvasRef.current }).catch(() => {}); // error shows via `error`
  }, [start, hand]);
  useEffect(() => stop, [stop]);

  // attempt after attempt while the page is open; a new word/mode cancels the one in flight
  useEffect(() => {
    if (status !== "ready" || !expect) return;
    const ac = new AbortController();
    (async () => {
      while (!ac.signal.aborted) {
        try {
          const r = await attempt({ expect, allowed }, { signal: ac.signal, onPhase: setPhase });
          setRows((rs) => [{ id: nextRow++, expect, mode, r }, ...rs].slice(0, 50));
        } catch (e) {
          if ((e as Error).name !== "AbortError") throw e;
        }
      }
    })();
    return () => {
      ac.abort();
      setPhase(null);
    };
  }, [status, attempt, expect, mode, allowed]);

  return (
    <div className="min-h-screen bg-base-200">
      <div className="navbar flex-wrap gap-2 bg-base-100 px-4 shadow-sm">
        <span className="mr-auto text-xl font-bold">Recognizer</span>
        <select
          className="select select-sm w-28"
          aria-label="Unit"
          value={search.unit}
          onChange={(e) => set({ unit: Number(e.target.value), lesson: undefined, word: undefined })}
        >
          {TEST_UNITS.map((u) => (
            <option key={u.id} value={u.id}>
              Unit {u.id}
            </option>
          ))}
        </select>
        <select
          className="select select-sm w-64"
          aria-label="Lesson"
          value={lesson.id}
          onChange={(e) => set({ lesson: e.target.value, word: undefined })}
        >
          {lessons.map((l) => {
            const missing = dedupe(l.items).filter((i) => !isRecognizable(i)).length;
            return (
              <option key={l.id} value={l.id}>
                {l.label} {l.title}
                {missing > 0 && ` (${missing} missing)`}
              </option>
            );
          })}
        </select>
        <select className="select select-sm w-44" aria-label="Compare" value={mode} onChange={(e) => set({ mode: e.target.value as Mode })}>
          {Object.entries(MODES).map(([m, label]) => (
            <option key={m} value={m}>
              {label}
            </option>
          ))}
        </select>
        <label className="label cursor-pointer gap-2">
          Left-handed
          <input type="checkbox" className="toggle toggle-sm" checked={hand === "left"} onChange={(e) => setHand(e.target.checked ? "left" : "right")} />
        </label>
      </div>

      <div className="mx-auto flex max-w-5xl flex-wrap gap-2 px-4 pt-4">
        {words.map((w) => {
          const key = itemKey(w);
          const ok = isRecognizable(w);
          const selected = expect !== null && itemKey(expect) === key;
          return (
            <button
              key={key}
              type="button"
              className={`btn btn-sm ${selected ? "btn-primary" : ok ? "btn-outline" : "btn-disabled"}`}
              disabled={!ok}
              onClick={() => set({ word: key })}
            >
              {name(w)}
              {ok ? <TrainBadge item={w} /> : <span className="badge badge-warning badge-xs">missing</span>}
            </button>
          );
        })}
      </div>

      <main className="mx-auto grid max-w-5xl gap-4 p-4 md:grid-cols-2">
        {error && (
          <div role="alert" className="alert alert-error md:col-span-2">
            <span>
              {error.code}: {error.message}
            </span>
          </div>
        )}

        <div className="relative aspect-4/3 w-full overflow-hidden rounded-box bg-base-300">
          <video ref={videoRef} className="absolute inset-0 size-full -scale-x-100 object-cover" playsInline muted />
          <canvas ref={canvasRef} className="absolute inset-0 size-full -scale-x-100 object-cover" />
          <div className="absolute left-3 top-3 flex gap-2">
            {status === "loading" && (
              <span className="badge badge-neutral gap-2">
                <span className="loading loading-spinner loading-xs" />
                loading
              </span>
            )}
            {phase && <span className={`badge ${PHASE_BADGE[phase]}`}>{phase}</span>}
          </div>
        </div>

        <ReferenceClips item={expect} scope={TEST_WORDS} />

        <div className="card bg-base-100 shadow-sm md:col-span-2">
          <div className="card-body">
            <div className="flex items-center gap-2">
              <h2 className="card-title mr-auto">Sign: {name(expect)}</h2>
              {allowed && <span className="badge badge-ghost">{allowed.length} classes</span>}
              <button type="button" className="btn btn-ghost btn-sm btn-square" aria-label="Clear history" onClick={() => setRows([])}>
                <IconTrash size={18} />
              </button>
            </div>
            <ul className="list">
              {rows.map(({ id, expect: e, mode: m, r }) => (
                <li key={id} className="list-row items-center">
                  <span className={`badge ${VERDICT_BADGE[r.verdict]}`}>{r.verdict}</span>
                  <span className="list-col-grow">
                    <span className="text-base-content/60">{name(e)} → </span>
                    {name(r.predicted)}
                    {r.reason && <span className="text-base-content/60"> · {r.reason}</span>}
                  </span>
                  <span className="badge badge-ghost badge-sm">{MODES[m]}</span>
                  <span className="tabular-nums text-sm">{(r.confidence * 100).toFixed(0)}%</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}

/** Training videos behind a sign, in its picker button (letters/digits: see the Reference card). */
function TrainBadge({ item }: { item: Item }) {
  const c = trainCount(item);
  if (!c) return null;
  return c.kind === "sign" ? <span className="badge badge-ghost badge-xs tabular-nums">{c.videos}</span> : null;
}

const isMode = (m: unknown): m is Mode => typeof m === "string" && m in MODES;

// Dev-only test page for the ML session. No guard, not linked from the app.
export const Route = createFileRoute("/dev/test")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    unit: LESSONS_BY_UNIT.has(Number(s.unit)) ? Number(s.unit) : TEST_UNITS[0].id,
    lesson: typeof s.lesson === "string" ? s.lesson : undefined,
    word: typeof s.word === "string" ? s.word : undefined,
    mode: isMode(s.mode) ? s.mode : "lesson",
  }),
  component: RecognizerDemo,
});
