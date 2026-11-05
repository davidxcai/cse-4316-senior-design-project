import type { Frame } from "../../types/sign";

/**
 * Static handshape classifier for letters and digits (ml/handshape/train_hs.py, trained on ASL-HG).
 * Classes come from public/model/handshape_labels.json: A-Z and 1-9. 0 is scored with O (same handshape in ASL);
 * J and Z here are only their end-poses, the moving letters are judged by motionLetters.ts.
 *
 * The feature code below must match `features` and `clip_probs` in train_hs.py.
 */

const N_POINTS = 21;
export const HANDSHAPE_DIM = N_POINTS * 3;

/**
 * One hand -> 63 normalized values. `hand` is MediaPipe's flattened 21x3 image landmarks, `left` whether it sits in
 * the "Left" slot, `aspect` = video width / height.
 */
export function handFeatures(hand: number[], left: boolean, aspect: number): Float32Array {
  const out = new Float32Array(HANDSHAPE_DIM);
  const sx = left ? -aspect : aspect;
  const wx = hand[0] * sx, wy = hand[1], wz = hand[2] * aspect;
  const scale = Math.max(Math.hypot(hand[27] * sx - wx, hand[28] - wy), 1e-6); // point 9 = middle-finger knuckle
  for (let i = 0; i < N_POINTS; i++) {
    out[i * 3] = (hand[i * 3] * sx - wx) / scale;
    out[i * 3 + 1] = (hand[i * 3 + 1] - wy) / scale;
    out[i * 3 + 2] = (hand[i * 3 + 2] * aspect - wz) / scale;
  }
  return out;
}

/**
 * Inputs for the frames to classify: the middle half of the frames showing the dominant hand (the one seen most),
 * so the hand rising into place and dropping away doesn't count. Returns [n, 63] row-major, or null if no hand.
 */
export function clipFeatures(frames: Frame[], aspect: number): { data: Float32Array; n: number } | null {
  const seen = [0, 1].map((s) => frames.filter((f) => f.hands[s] !== null).length);
  const slot = seen[1] > seen[0] ? 1 : 0; // ties -> slot 0, as np.argmax in train_hs.py
  if (seen[slot] === 0) return null;
  const hands = frames.map((f) => f.hands[slot]).filter((h): h is number[] => h !== null);
  const a = hands.length >> 2;
  const mid = hands.slice(a, Math.max(a + 1, (3 * hands.length) >> 2));
  const data = new Float32Array(mid.length * HANDSHAPE_DIM);
  mid.forEach((h, i) => data.set(handFeatures(h, slot === 0, aspect), i * HANDSHAPE_DIM));
  return { data, n: mid.length };
}

/** Mean of per-frame softmax probabilities, returned as log-probabilities (so a later softmax gives the mean back). */
export function meanLogProbs(logits: Float32Array, n: number, classes: number): Float32Array {
  const mean = new Float64Array(classes);
  for (let r = 0; r < n; r++) {
    const row = logits.subarray(r * classes, (r + 1) * classes);
    const max = Math.max(...row);
    let sum = 0;
    for (const v of row) sum += Math.exp(v - max);
    for (let c = 0; c < classes; c++) mean[c] += Math.exp(row[c] - max) / sum / n;
  }
  return Float32Array.from(mean, (p) => Math.log(Math.max(p, 1e-12)));
}
