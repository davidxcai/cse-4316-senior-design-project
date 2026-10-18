import type { Frame } from "../types/sign";

/**
 * Port of ml/dataset.py (load_clip -> trim -> to_tensor) for the "hands" feature group.
 * Must stay numerically identical to Python or accuracy silently drops. Output: [T=64, 256] row-major.
 */
export const T = 64;
export const FEATURE_DIM = 256;
const TRIM_PAD = 3;

const nanmedian = (xs: number[]): number => {
  const v = xs.filter((x) => !Number.isNaN(x)).sort((a, b) => a - b);
  if (v.length === 0) return NaN;
  const m = v.length >> 1;
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
};

/** numpy rounds .5 to the nearest even integer; Math.round does not. */
const roundHalfEven = (x: number): number => {
  const f = Math.floor(x);
  const d = x - f;
  if (d < 0.5) return f;
  if (d > 0.5) return f + 1;
  return f % 2 === 0 ? f : f + 1;
};

/** Body frame per clip: shoulder midpoint = origin, shoulder width = 1 unit. Missing frames use the clip median. */
function bodyFrame(frames: Frame[]) {
  const n = frames.length;
  const origin = Array.from({ length: n }, () => [NaN, NaN, NaN]);
  const width = new Array<number>(n).fill(NaN);
  frames.forEach((f, i) => {
    if (!f.shoulders) return;
    const [l, r] = f.shoulders;
    for (let k = 0; k < 3; k++) origin[i][k] = (l[k] + r[k]) / 2;
    width[i] = Math.hypot(l[0] - r[0], l[1] - r[1]);
  });
  if (origin.every((o) => Number.isNaN(o[0]))) {
    return { origin: origin.map(() => [0, 0, 0]), width: width.map(() => 1) };
  }
  const medO = [0, 1, 2].map((k) => nanmedian(origin.map((o) => o[k])));
  const medW = nanmedian(width);
  return {
    origin: origin.map((o) => o.map((v, k) => (Number.isNaN(v) ? medO[k] : v))),
    width: width.map((w) => (Number.isNaN(w) || w < 1e-3 ? medW : w)),
  };
}

/** Frames (one sign, any length) -> model input, or null when no hand was ever seen. */
export function preprocess(frames: Frame[]): Float32Array | null {
  const present = frames.map((f) => f.hands[0] !== null || f.hands[1] !== null);
  const first = present.indexOf(true);
  if (first < 0) return null;
  const last = present.lastIndexOf(true);
  const start = Math.max(first - TRIM_PAD, 0);
  const end = last + TRIM_PAD + 1;

  const { origin, width } = bodyFrame(frames); // body frame uses the whole clip, as in Python (trim comes after)
  const n = Math.min(end, frames.length) - start;

  const x = new Float32Array(T * FEATURE_DIM);
  const base = FEATURE_DIM / 2; // velocity block starts here
  for (let i = 0; i < T; i++) {
    const src = start + roundHalfEven((i * (n - 1)) / (T - 1));
    const row = i * FEATURE_DIM;
    frames[src].hands.forEach((h, slot) => {
      if (!h) return;
      for (let p = 0; p < 21; p++) {
        for (let k = 0; k < 3; k++) {
          x[row + slot * 63 + p * 3 + k] = (h[p * 3 + k] - origin[src][k]) / width[src];
        }
      }
      x[row + 126 + slot] = 1; // presence flag
    });
  }
  // velocity = frame-to-frame diff of the first 128 dims (first row 0)
  for (let i = 1; i < T; i++) {
    for (let d = 0; d < base; d++) x[i * FEATURE_DIM + base + d] = x[i * FEATURE_DIM + d] - x[(i - 1) * FEATURE_DIM + d];
  }
  return x;
}
