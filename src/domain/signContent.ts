/**
 * What the Learn / Watch / Recognize / Sign cards show for an item: label, English meaning, handshape note, reference clip.
 * Pure data + lookups. See signContent.md.
 */
import type { Item } from "../recognition";
import { SIGN_CLIPS } from "./signClips";

/** A fluent-signer reference clip: a YouTube video id and the [start, end) seconds that show the sign. */
export type Clip = { videoId: string; start: number; end: number };

export type SignInfo = {
  /** 'HELLO' | 'A' | '7' */
  label: string;
  /** short English meaning [S.10]; null for letters and numbers (the label says it all) */
  meaning: string | null;
  /** handshape note [S.11]; null until written by fluent signers */
  handshape: string | null;
  /** reference video [S.7]; null until a fluent-signer clip is chosen */
  clip: Clip | null;
};

/**
 * Stable identity of an item: 'sign:HELLO', 'letter:A', 'number:7'. Persisted in weak_signs.item_key, so never change
 * the format. Signs keep their curriculum spelling ('sign:THANK-YOU').
 */
export function itemKey(item: Item): string {
  switch (item.kind) {
    case "sign":
      return `sign:${item.gloss.toUpperCase()}`;
    case "letter":
      return `letter:${item.char.toUpperCase()}`;
    case "number":
      return `number:${item.value}`;
  }
}

/** Inverse of itemKey. null for anything itemKey can't produce. */
export function itemFromKey(key: string): Item | null {
  const sign = /^sign:([A-Z0-9'-]+)$/.exec(key);
  if (sign) return { kind: "sign", gloss: sign[1] };
  const letter = /^letter:([A-Z])$/.exec(key);
  if (letter) return { kind: "letter", char: letter[1] };
  const number = /^number:(0|[1-9][0-9]{0,2})$/.exec(key);
  if (number) return { kind: "number", value: Number(number[1]) };
  return null;
}

export const itemLabel = (item: Item): string =>
  item.kind === "sign" ? item.gloss.toUpperCase() : item.kind === "letter" ? item.char.toUpperCase() : String(item.value);

// ---------------------------------------------------------------------------
// Meanings [S.10], keyed by gloss. Unit 1 only so far; missing glosses show no meaning.
// TODO(later): the lesson view shows the meaning under the gloss even when they match (HELLO / "hello").
// Hide the meaning line when it equals the label ignoring case; keep it for MY, DEAF, HEARING, THANK-YOU, etc.
// ---------------------------------------------------------------------------

const MEANINGS: Record<string, string> = {
  // 1.1 Greetings
  HELLO: "hello",
  NICE: "nice",
  MEET: "meet",
  NAME: "name",
  MY: "my, mine",
  YOUR: "your, yours",
  DEAF: "Deaf, deaf",
  HEARING: "hearing (not deaf)",
  YES: "yes",
  NO: "no",
  "THANK-YOU": "thank you",
  PLEASE: "please",
  SORRY: "sorry",
  // 1.4 Shapes & Colors
  SAME: "same",
  DIFFERENT: "different",
  CIRCLE: "circle",
  SQUARE: "square",
  TRIANGLE: "triangle",
  RED: "red",
  BLUE: "blue",
  GREEN: "green",
  YELLOW: "yellow",
  BLACK: "black",
  WHITE: "white",
};

// ---------------------------------------------------------------------------
// Handshape notes [S.11], keyed by itemKey(). Must come from fluent signers; intentionally empty.
// ---------------------------------------------------------------------------

const HANDSHAPES: Record<string, string> = {};

export function signInfo(item: Item): SignInfo {
  const key = itemKey(item);
  return {
    label: itemLabel(item),
    meaning: item.kind === "sign" ? (MEANINGS[item.gloss.toUpperCase()] ?? null) : null,
    handshape: HANDSHAPES[key] ?? null,
    clip: SIGN_CLIPS[key] ?? null, // signClips.ts: generated itemKey → clip table [S.7]
  };
}
