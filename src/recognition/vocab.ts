import type { MotionLetter } from "../lib/fingerspell/motionLetters";
import type { Item } from "./types";
import SIGN_LABELS from "../../public/model/labels.json";
import HANDSHAPE_LABELS from "../../public/model/handshape_labels.json";

/**
 * What the shipped models can recognize. Read from the exported labels at build time, so retraining
 * (ml/export_onnx.py rewrites public/model/labels.json) updates isRecognizable without UI changes.
 */
export const signLabels: readonly string[] = SIGN_LABELS;
export const handshapeLabels: readonly string[] = HANDSHAPE_LABELS;

/**
 * Lesson glosses and model labels meet on a normalized key: upper case, punctuation dropped, ASL Citizen's variant
 * suffix dropped. So "THANK-YOU" = THANKYOU and "DON'T-LIKE" = DONTLIKE, and "WANT" covers both WANT1 and WANT2
 * (different but equally correct signs; their probabilities are added).
 */
export const glossKey = (gloss: string) => gloss.toUpperCase().replace(/[^A-Z0-9]/g, "").replace(/\d+$/, "");

const labelsByKey = new Map<string, string[]>();
for (const l of signLabels) labelsByKey.set(glossKey(l), [...(labelsByKey.get(glossKey(l)) ?? []), l]);

/** Model labels a lesson gloss accepts ([] if the sign model doesn't know it). An exact label picks one variant. */
export const labelsFor = (gloss: string): string[] => (signLabels.includes(gloss) ? [gloss] : (labelsByKey.get(glossKey(gloss)) ?? []));

/** Moving letters: judged by the motion check, not by handshape alone. */
const MOTION_LETTERS = new Set<string>(["J", "Z"]);
export const motionLetterOf = (item: Item): MotionLetter | undefined =>
  item.kind === "letter" && MOTION_LETTERS.has(item.char.toUpperCase()) ? (item.char.toUpperCase() as MotionLetter) : undefined;

/** Whether attempt() can judge this item. Lessons should skip the produce step when false. */
/**
 * Handshape-model class for a letter or digit, or undefined. 0 uses O: the same handshape in ASL (ASL-HG's own "0"
 * is a nonstandard two-handed sign and is not trained). Numbers above 9 are movement signs, not handshapes.
 */
export function handshapeLabelOf(item: Item): string | undefined {
  const label =
    item.kind === "letter" ? item.char.toUpperCase()
    : item.kind === "number" && Number.isInteger(item.value) && item.value >= 0 && item.value <= 9 ? (item.value === 0 ? "O" : String(item.value))
    : undefined;
  return label !== undefined && handshapeLabels.includes(label) ? label : undefined;
}

export function isRecognizable(item: Item): boolean {
  switch (item.kind) {
    case "sign":
      return labelsFor(item.gloss).length > 0;
    case "letter":
      return motionLetterOf(item) !== undefined || handshapeLabelOf(item) !== undefined;
    case "number":
      return handshapeLabelOf(item) !== undefined;
  }
}

/** Stable identity of an item (variant suffixes and letter case ignored). */
export const itemKey = (item: Item) =>
  item.kind === "sign" ? `sign:${glossKey(item.gloss)}`
  : item.kind === "letter" ? `letter:${item.char.toUpperCase()}`
  : `number:${item.value}`;
