import type { AttemptResult, Item } from "./types";

/**
 * Turning sign-model logits into a lesson verdict. Pure (type-only imports) so it can be tested in Node.
 *
 * The model scores every sign it knows, not only the lesson's. Rejection is decided on that full distribution
 * first, so masking to the lesson subset can't force a guess:
 *  1. p = softmax(logits / temperature) over the whole vocabulary
 *  2. allowedMass = total p of the allowed signs (a sign with two variant labels counts both). Low = the clip
 *     looks like something outside the lesson (or like nothing) -> rejected "out-of-set"
 *  3. within the allowed signs, renormalize; top share low = torn between allowed signs -> rejected "unsure"
 *  4. otherwise the top allowed sign is the answer: correct if it is the expected one, else wrong
 *
 * Thresholds chosen with ml/eval_lessons.py on val signers (unit12_hands, 2026-11-05; unit12_hands_rev picked the
 * same ones, 2026-11-06). On held-out test signers, per lesson target: 91% of real attempts accepted, 0.3% of other
 * lesson signs and 1.3% of never-seen signs wrongly accepted.
 *
 * With allowed = [expect] only, step 3 always passes, so the outcome is correct or rejected, never wrong.
 */
export const SIGN_DECISION_DEFAULTS = {
  /** softmax temperature; >1 flattens. 1 and 1.5 scored the same (label smoothing already softens) */
  temperature: 1,
  /** reject when the allowed signs together hold less than this share of the full-vocab probability */
  minAllowedMass: 0.2,
  /** reject when the best allowed sign holds less than this share of the allowed mass */
  minShare: 0.4,
};
export type SignDecisionConfig = typeof SIGN_DECISION_DEFAULTS;

/**
 * Same rule for letters and digits (handshape model; the "logits" are log clip-averaged probabilities).
 * Letters are decided with the digit classes removed first (lessons never mix the two, and digits otherwise soak up
 * the mass of same-shaped letters: W/6, V/2, O/0); digits use the full distribution.
 * Tuned with ml/handshape/eval_thresholds.py (2026-11-05) on held-out signers, per lesson target:
 *   letters A-Z   accept 94%, random sign accepted 1.2%      fist letters (A S T M N E)  97%, 1.6%
 *   digits 1-9    accept 98%, random sign accepted 2.0%      (no held-out fluent clips of 5)
 * Letter positives are ASL-HG stills grouped into pseudo-clips, so expect less on webcam.
 */
export const HANDSHAPE_DECISION_DEFAULTS: { letter: SignDecisionConfig; number: SignDecisionConfig } = {
  letter: { temperature: 1, minAllowedMass: 0.6, minShare: 0.4 },
  number: { temperature: 1, minAllowedMass: 0.7, minShare: 0.7 },
};

export interface SignCandidate {
  item: Item;
  /** indices into the model's labels (more than one when the sign has variants) */
  indices: number[];
}

export function decideSign(
  logits: ArrayLike<number>,
  expected: SignCandidate,
  allowed: SignCandidate[],
  cfg: SignDecisionConfig = SIGN_DECISION_DEFAULTS,
): AttemptResult {
  const z = Array.from(logits, (l) => l / cfg.temperature);
  const max = Math.max(...z);
  const e = z.map((v) => Math.exp(v - max));
  const total = e.reduce((a, b) => a + b, 0);
  const p = e.map((v) => v / total);

  const prob = (c: SignCandidate) => c.indices.reduce((sum, i) => sum + p[i], 0);
  // each label counts once, on its first candidate (expected first), so duplicates can't inflate the mass
  const seen = new Set<number>();
  const cands = [expected, ...allowed]
    .map((c) => ({ ...c, indices: c.indices.filter((i) => !seen.has(i) && (seen.add(i), true)) }))
    .filter((c) => c.indices.length > 0);
  const exp = cands[0]; // expected is never emptied: it claims its labels first
  const mass = cands.reduce((s, c) => s + prob(c), 0);
  const best = cands.reduce((b, c) => (prob(c) > prob(b) ? c : b));
  const share = mass > 0 ? prob(best) / mass : 0;

  if (mass < cfg.minAllowedMass) return { verdict: "rejected", expected: expected.item, predicted: null, confidence: mass, reason: "out-of-set" };
  if (share < cfg.minShare) return { verdict: "rejected", expected: expected.item, predicted: null, confidence: share, reason: "unsure" };
  // confidence = how much of the whole distribution sits on the answer: both "inside the lesson" and "this one"
  const confidence = prob(best);
  return best === exp
    ? { verdict: "correct", expected: expected.item, predicted: best.item, confidence }
    : { verdict: "wrong", expected: expected.item, predicted: best.item, confidence };
}
