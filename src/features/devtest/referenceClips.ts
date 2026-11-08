/**
 * /dev/test reference clips: load a landmark file made by ml/export_reference.py and look up how much training data a
 * word had. Pure, no React.
 */
import type { Item } from "../../recognition";
import { glossKey, handshapeLabelOf, labelsFor, motionLetterOf } from "../../recognition/vocab";
import TRAIN_COUNTS from "./trainCounts.json";

export type Split = "train" | "val" | "test";

/** One clip: `xy` is [frames, points, 2] in body units (shoulder midpoint = 0, shoulder width = 1), NaN = missing. */
export type RefClip = { label: string; split: Split; frames: number; xy: Float32Array };

export type RefSet = {
  /** points per frame, and how they split: hand slot 0, hand slot 1, pose, face (0 in current exports) */
  points: number;
  groups: { hands: number; pose: number; face: number };
  /** point index pairs to draw as lines */
  edges: [number, number][];
  /** word key (glossKey) -> clips, held-out first */
  byKey: Map<string, RefClip[]>;
  total: number;
};

type RawFile = {
  scale: number;
  points: { hands: number; pose: number; face: number };
  edges: [number, number][];
  clips: { key: string; label: string; split: Split; frames: number; xy: string }[];
};

/** ASL Citizen names digits as words. */
const DIGIT_GLOSS = ["ZERO", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE"];

/** Keys in the reference file that hold clips of this item. */
export function clipKeys(item: Item): string[] {
  switch (item.kind) {
    case "sign":
      return [...new Set([glossKey(item.gloss), ...labelsFor(item.gloss).map(glossKey)])];
    case "number":
      return item.value >= 0 && item.value <= 9 ? [DIGIT_GLOSS[item.value]] : [];
    case "letter":
      return []; // ASL Citizen has no fingerspelled letters
  }
}

const MISSING = -32768;

function decode(b64: string, scale: number): Float32Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const view = new DataView(bytes.buffer);
  const out = new Float32Array(bin.length / 2);
  for (let i = 0; i < out.length; i++) {
    const v = view.getInt16(i * 2, true);
    out[i] = v === MISSING ? NaN : v / scale;
  }
  return out;
}

/** Gzipped or plain JSON, told apart by the gzip magic bytes (a server may already have decompressed it). */
async function readText(blob: Blob): Promise<string> {
  const head = new Uint8Array(await blob.slice(0, 2).arrayBuffer());
  if (head[0] !== 0x1f || head[1] !== 0x8b) return blob.text();
  return new Response(blob.stream().pipeThrough(new DecompressionStream("gzip"))).text();
}

/** The committed reference file, served by the dev server only (not imported, so never in the build). */
export const DEV_REFERENCE_URL = "/dev-data/unit1-2.landmarks.json.gz";

/** Parse a `.landmarks.json.gz` (or plain .json), keeping only clips of `scope`'s words. */
export async function loadReference(blob: Blob, scope: readonly Item[]): Promise<RefSet> {
  const raw = JSON.parse(await readText(blob)) as RawFile;
  const wanted = new Set(scope.flatMap(clipKeys));
  const groups = raw.points;
  const points = groups.hands + groups.pose + groups.face;
  const byKey = new Map<string, RefClip[]>();
  let total = 0;
  for (const c of raw.clips) {
    if (!wanted.has(c.key)) continue;
    const clips = byKey.get(c.key) ?? [];
    clips.push({ label: c.label, split: c.split, frames: c.frames, xy: decode(c.xy, raw.scale) });
    byKey.set(c.key, clips);
    total++;
  }
  return { points, groups, edges: raw.edges, byKey, total };
}

export const clipsFor = (set: RefSet, item: Item): RefClip[] => clipKeys(item).flatMap((k) => set.byKey.get(k) ?? []);

export type TrainCount =
  | { kind: "sign"; videos: number; variants: number; reversed: boolean }
  | { kind: "handshape"; videos: number; photos: number; signers: number }
  | { kind: "rule" };

const counts = TRAIN_COUNTS as {
  signs: Record<string, number>;
  reversible: string[];
  handshape: Record<string, { photos: number; signers: number; videos: number }>;
};

/** Training data behind an item's classifier, or null if no model knows it. */
export function trainCount(item: Item): TrainCount | null {
  if (item.kind === "sign") {
    const labels = labelsFor(item.gloss);
    if (labels.length === 0) return null;
    return {
      kind: "sign",
      videos: labels.reduce((n, l) => n + (counts.signs[l] ?? 0), 0),
      variants: labels.length,
      reversed: labels.some((l) => counts.reversible.includes(l)),
    };
  }
  if (motionLetterOf(item)) return { kind: "rule" };
  const label = handshapeLabelOf(item);
  const c = label === undefined ? undefined : counts.handshape[label];
  return c ? { kind: "handshape", ...c } : null;
}
