import type { Frame } from "../../types/sign";

/**
 * Stopgap recognizer for the two moving letters, J and Z, until there is multi-signer motion data to train on.
 *
 * A clip passes when:
 *  1. the dominant hand holds the right handshape (J: pinky "I"; Z: index point) for long enough, and
 *  2. the traced point (J: pinky tip, Z: wrist) moves enough (not a static I or D/1), and
 *  3. its path matches a reference stroke shape (J: down then hook; Z: across, diagonal back, across).
 *
 * Reference shapes come from the standard letter definitions, not from anyone's recordings. Paths are compared
 * mirror-invariantly, so left- and right-handed signers and mirrored/unmirrored cameras all work.
 * Handshape (1) is a geometric rule for now; pass `shapeOk` to swap in the trained handshape model later.
 *
 * Imports are type-only so Node can run this file directly (scripts/eval-motion.ts).
 */

export type MotionLetter = "J" | "Z";
export type MotionVerdict = "ok" | "no-hand" | "wrong-handshape" | "no-motion" | "wrong-path";

export interface MotionCheck {
  letter: MotionLetter;
  verdict: MotionVerdict;
  ok: boolean;
  /** frames in the longest run holding the expected handshape */
  shapeFrames: number;
  /** size of the traced path in the best stroke window, in hand lengths */
  extent: number;
  /** mean distance from the reference stroke after alignment (0 = identical); NaN if not computed */
  pathCost: number;
}

/** All thresholds in one place. Initial values; tune with scripts/eval-motion.ts. */
export const MOTION_DEFAULTS = {
  /** finger straightness (chord / bone length) above this = extended */
  extended: 0.8,
  /** ...and below this = curled */
  curled: 0.7,
  /** handshape gaps up to this long don't break a run (tracking flicker, the twist in J) */
  maxGapMs: 200,
  /** minimum handshape run */
  minShapeFrames: 6,
  /** how long one stroke of the letter can take */
  minStrokeMs: { J: 250, Z: 400 } as Record<MotionLetter, number>,
  maxStrokeMs: { J: 1500, Z: 2000 } as Record<MotionLetter, number>,
  /** minimum movement of the traced point within the stroke, in hand lengths (wrist to middle-finger knuckle) */
  minExtent: { J: 0.5, Z: 0.8 } as Record<MotionLetter, number>,
  /** maximum path cost to accept */
  maxPathCost: { J: 0.2, Z: 0.2 } as Record<MotionLetter, number>,
};
export type MotionConfig = typeof MOTION_DEFAULTS;

type V3 = [number, number, number];
type V2 = [number, number];

const WRIST = 0;
const MIDDLE_MCP = 9;
/** [mcp, pip, dip, tip] per finger */
const FINGERS = { index: [5, 6, 7, 8], middle: [9, 10, 11, 12], ring: [13, 14, 15, 16], pinky: [17, 18, 19, 20] };
/**
 * Landmark whose path is traced. J: pinky tip. Z: wrist, because the whole hand moves and the index tip is the
 * badly tracked point (see ruleHandshape). On the SignAlphaSet clips the wrist separated Z best of wrist, index
 * knuckle, middle knuckle and index tip.
 */
const TIP: Record<MotionLetter, number> = { J: 20, Z: WRIST };

/** MediaPipe x and z are in image-width units and y in image-height units; convert all to height units. */
const point = (h: number[], i: number, aspect: number): V3 => [h[i * 3] * aspect, h[i * 3 + 1], h[i * 3 + 2] * aspect];
const dist = (a: number[], b: number[]) => Math.hypot(...a.map((v, k) => v - b[k]));

/** 1 for a straight finger, smaller as it curls (tip comes back toward the knuckle). */
function straightness(h: number[], [mcp, pip, dip, tip]: number[], aspect: number) {
  const p = [mcp, pip, dip, tip].map((i) => point(h, i, aspect));
  const bones = dist(p[0], p[1]) + dist(p[1], p[2]) + dist(p[2], p[3]);
  return bones > 0 ? dist(p[0], p[3]) / bones : 0;
}

/**
 * Rule-based handshape gate. Thumb is ignored: it differs between I/J variants and tracks poorly.
 *
 * Z has no rule: its index finger points out toward the viewer, and MediaPipe misreads that foreshortened hand
 * badly (on the SignAlphaSet Z clips the index finger even measures shorter than the curled ones). Z is checked on
 * motion only until the trained handshape model is passed in as `shapeOk`.
 */
export function ruleHandshape(h: number[], letter: MotionLetter, aspect: number, cfg: MotionConfig = MOTION_DEFAULTS) {
  if (letter === "Z") return true;
  const s = (f: keyof typeof FINGERS) => straightness(h, FINGERS[f], aspect);
  return s("pinky") > cfg.extended && s("index") < cfg.curled && s("middle") < cfg.curled && s("ring") < cfg.curled;
}

/** Reference strokes, y pointing down. Mirroring handles which way a given signer/camera sees them. */
const TEMPLATES: Record<MotionLetter, V2[]> = {
  // straight down, then a hook that curls to one side and slightly back up
  J: [[0, 0], [0, 0.55], [-0.08, 0.8], [-0.25, 0.9], [-0.42, 0.82]],
  // across, diagonal back and down, across
  Z: [[0, 0], [1, 0], [0, 1], [1, 1]],
};

const N = 24;

/** Translate to the first point, scale by the larger bounding-box side, resample evenly along the path. */
function normalize(path: V2[]): V2[] {
  const xs = path.map((p) => p[0]);
  const ys = path.map((p) => p[1]);
  const size = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) || 1;
  const pts = path.map(([x, y]): V2 => [(x - path[0][0]) / size, (y - path[0][1]) / size]);
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + dist(pts[i], pts[i - 1]));
  const total = cum[cum.length - 1];
  if (total === 0) return Array.from({ length: N }, () => [0, 0]);
  const out: V2[] = [];
  let j = 0;
  for (let k = 0; k < N; k++) {
    const target = (k / (N - 1)) * total;
    while (j < pts.length - 2 && cum[j + 1] < target) j++;
    const seg = cum[j + 1] - cum[j] || 1;
    const u = Math.min(Math.max((target - cum[j]) / seg, 0), 1);
    out.push([pts[j][0] + u * (pts[j + 1][0] - pts[j][0]), pts[j][1] + u * (pts[j + 1][1] - pts[j][1])]);
  }
  return out;
}

/** Dynamic time warping cost, averaged over the alignment path length. Tolerates uneven speed along the stroke. */
function dtw(a: V2[], b: V2[]) {
  const D = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(Infinity));
  const L = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  D[0][0] = 0;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const opts: [number, number][] = [[D[i - 1][j - 1], L[i - 1][j - 1]], [D[i - 1][j], L[i - 1][j]], [D[i][j - 1], L[i][j - 1]]];
      const [best, len] = opts.reduce((m, o) => (o[0] < m[0] ? o : m));
      D[i][j] = best + dist(a[i - 1], b[j - 1]);
      L[i][j] = len + 1;
    }
  }
  return D[a.length][b.length] / L[a.length][b.length];
}

const NORMALIZED_TEMPLATES = Object.fromEntries(
  Object.entries(TEMPLATES).map(([k, t]) => [k, [normalize(t), normalize(t.map(([x, y]): V2 => [-x, y]))]]),
) as Record<MotionLetter, [V2[], V2[]]>;

/** Mirror-invariant path cost against the letter's reference stroke. */
export function pathCost(path: V2[], letter: MotionLetter) {
  const p = normalize(path);
  return Math.min(...NORMALIZED_TEMPLATES[letter].map((t) => dtw(p, t)));
}

/** Slot (0/1) of the hand seen in the most frames, or -1. */
function dominantSlot(frames: Frame[]) {
  const n = [0, 1].map((s) => frames.filter((f) => f.hands[s] !== null).length);
  return n[0] === 0 && n[1] === 0 ? -1 : n[1] >= n[0] ? 1 : 0;
}

/** Longest run of frames passing `ok`, bridging gaps up to maxGapMs. Returns [start, end] inclusive, or null. */
function longestRun(frames: Frame[], ok: boolean[], maxGapMs: number): [number, number] | null {
  let best: [number, number] | null = null;
  let start = -1;
  let last = -1;
  const close = () => {
    if (start >= 0 && (!best || frames[last].t - frames[start].t > frames[best[1]].t - frames[best[0]].t)) best = [start, last];
  };
  ok.forEach((v, i) => {
    if (!v) return;
    if (start >= 0 && frames[i].t - frames[last].t > maxGapMs) {
      close();
      start = -1;
    }
    if (start < 0) start = i;
    last = i;
  });
  close();
  return best;
}

/** 3-frame moving average to take the jitter out of the traced path. */
const smooth = (p: V2[]): V2[] =>
  p.map((_, i) => {
    const w = p.slice(Math.max(i - 1, 0), i + 2);
    return [w.reduce((s, q) => s + q[0], 0) / w.length, w.reduce((s, q) => s + q[1], 0) / w.length];
  });

const bboxSize = (p: V2[]) => {
  const xs = p.map((q) => q[0]);
  const ys = p.map((q) => q[1]);
  return Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
};

/**
 * Check whether a captured attempt (e.g. one Segmenter clip) is the given moving letter.
 * `aspect` = video width / height (640x480 webcam = 4/3).
 *
 * The attempt also contains the hand rising into place and dropping afterwards (and practice clips may repeat the
 * letter), so the stroke is searched for: every time window of plausible letter duration that moves enough is
 * compared with the reference, and the best match counts.
 */
export function checkMotionLetter(
  frames: Frame[],
  letter: MotionLetter,
  aspect = 4 / 3,
  cfg: MotionConfig = MOTION_DEFAULTS,
  shapeOk: (hand: number[]) => boolean = (h) => ruleHandshape(h, letter, aspect, cfg),
): MotionCheck {
  const result = (verdict: MotionVerdict, shapeFrames = 0, extent = 0, cost = NaN): MotionCheck => ({
    letter, verdict, ok: verdict === "ok", shapeFrames, extent, pathCost: cost,
  });

  const slot = dominantSlot(frames);
  if (slot === -1) return result("no-hand");
  const run = longestRun(frames, frames.map((f) => f.hands[slot] !== null && shapeOk(f.hands[slot]!)), cfg.maxGapMs);
  const win = run ? frames.slice(run[0], run[1] + 1).filter((f) => f.hands[slot] !== null) : [];
  if (win.length < cfg.minShapeFrames) return result("wrong-handshape", win.length);

  const hands = win.map((f) => f.hands[slot]!);
  const sizes = hands.map((h) => dist(point(h, WRIST, aspect), point(h, MIDDLE_MCP, aspect))).sort((a, b) => a - b);
  const handSize = sizes[sizes.length >> 1];
  const path = smooth(hands.map((h): V2 => {
    const [x, y] = point(h, TIP[letter], aspect);
    return [x, y];
  }));
  const t = win.map((f) => f.t);

  let extent = 0;
  let cost = Infinity;
  for (let i = 0; i < path.length; i++) {
    for (let j = i + 2; j < path.length && t[j] - t[i] <= cfg.maxStrokeMs[letter]; j++) {
      if (t[j] - t[i] < cfg.minStrokeMs[letter]) continue;
      const seg = path.slice(i, j + 1);
      const e = bboxSize(seg) / handSize;
      extent = Math.max(extent, e);
      if (e >= cfg.minExtent[letter]) cost = Math.min(cost, pathCost(seg, letter));
    }
  }
  if (cost === Infinity) return result("no-motion", win.length, extent);
  return result(cost <= cfg.maxPathCost[letter] ? "ok" : "wrong-path", win.length, extent, cost);
}
