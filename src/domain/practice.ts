/**
 * Unit practice: an endless session over the words of one unit. Pure; pass `rng` for deterministic output.
 * A round is Recognize over every word with a clip, then Sign over every recognizable word (camera mode only),
 * each block shuffled. Blocks keep the camera running for a whole Sign block instead of restarting per card.
 */
import { isRecognizable, type Item } from "../recognition";
import type { Unit } from "./curriculum";
import { dedupe, recognizeQuestion, shuffle, signTasks, type LessonMode, type RecognizeQuestion, type SignTask } from "./lessonPlan";
import type { AttemptVerdict, SignRecord } from "./lessonSession";
import { itemKey, signInfo } from "./signContent";

export type PracticeCard = { kind: "recognize"; question: RecognizeQuestion } | { kind: "sign"; task: SignTask };

/** Items of the unit's regular lessons the user has completed (quizzes and reviews add nothing new). */
export function practiceItems(unit: Unit, completed: ReadonlySet<string>): Item[] {
  return dedupe(unit.lessons.filter((l) => l.kind === "lesson" && completed.has(l.id)).flatMap((l) => l.items));
}

/** Whether a round over `items` has at least one card in this mode. */
export const hasCards = (items: readonly Item[], mode: LessonMode): boolean =>
  items.some((i) => signInfo(i).clip !== null || (mode === "camera" && isRecognizable(i)));

export function practiceRound(items: readonly Item[], mode: LessonMode, rng: () => number = Math.random): PracticeCard[] {
  const recognize = shuffle(
    items.filter((i) => signInfo(i).clip !== null),
    rng,
  ).map((item): PracticeCard => ({ kind: "recognize", question: recognizeQuestion(item, items, rng) }));
  if (mode !== "camera") return recognize;
  const sign = signTasks(shuffle(items, rng), items).map((task): PracticeCard => ({ kind: "sign", task }));
  return [...recognize, ...sign];
}

export type PracticeState = {
  cards: PracticeCard[];
  index: number;
  /** Recognize: the first choice picked on the current card */
  answer: Item | null;
  /** Sign: the current card's record */
  sign: SignRecord | null;
  /** first-try Recognize answers + signs done without the hint */
  correct: number;
  /** distinct item keys seen so far */
  practiced: string[];
};

function withPracticed(s: PracticeState, item: Item): string[] {
  const key = itemKey(item);
  return s.practiced.includes(key) ? s.practiced : [...s.practiced, key];
}

export function startPractice(items: readonly Item[], mode: LessonMode, rng: () => number = Math.random): PracticeState {
  return { cards: practiceRound(items, mode, rng), index: 0, answer: null, sign: null, correct: 0, practiced: [] };
}

export const currentCard = (s: PracticeState): PracticeCard | undefined => s.cards[s.index];

/** Recognize waits for an answer. Sign cards can always be skipped: practice never blocks. */
export function canNext(s: PracticeState): boolean {
  const card = currentCard(s);
  return !!card && (card.kind === "sign" || s.answer !== null);
}

/** The next card; past the end of the round, a fresh round is dealt. */
export function nextCard(s: PracticeState, items: readonly Item[], mode: LessonMode, rng: () => number = Math.random): PracticeState {
  if (!canNext(s)) return s;
  const base = { ...s, answer: null, sign: null };
  if (s.index + 1 < s.cards.length) return { ...base, index: s.index + 1 };
  return { ...base, cards: practiceRound(items, mode, rng), index: 0 };
}

/** First answer only. */
export function answerRecognize(s: PracticeState, choice: Item): PracticeState {
  const card = currentCard(s);
  if (card?.kind !== "recognize" || s.answer) return s;
  const right = itemKey(choice) === itemKey(card.question.item);
  return { ...s, answer: choice, correct: s.correct + (right ? 1 : 0), practiced: withPracticed(s, card.question.item) };
}

const NO_SIGN: SignRecord = { correct: false, hinted: false, missed: false };

export function recordSign(s: PracticeState, verdict: AttemptVerdict): PracticeState {
  const card = currentCard(s);
  const rec = s.sign ?? NO_SIGN;
  if (card?.kind !== "sign" || rec.correct) return s;
  if (verdict !== "correct") return rec.missed ? s : { ...s, sign: { ...rec, missed: true } };
  return {
    ...s,
    sign: { ...rec, correct: true },
    correct: s.correct + (rec.hinted ? 0 : 1),
    practiced: withPracticed(s, card.task.item),
  };
}

export function showSignHint(s: PracticeState): PracticeState {
  const card = currentCard(s);
  const rec = s.sign ?? NO_SIGN;
  if (card?.kind !== "sign" || rec.correct || rec.hinted) return s;
  return { ...s, sign: { ...rec, hinted: true } };
}

/** Same deck again from the current card, in the other layout (camera failed): drops the round's Sign cards. */
export function toWatch(s: PracticeState, items: readonly Item[], rng: () => number = Math.random): PracticeState {
  const card = currentCard(s);
  if (card?.kind === "recognize") return { ...s, cards: s.cards.filter((c) => c.kind === "recognize") };
  return { ...s, cards: practiceRound(items, "watch", rng), index: 0, answer: null, sign: null };
}
