/**
 * A lesson's step list. With a camera: Learn → Recognize → Sign → Culture (lessons), Recognize → Sign (quiz, review).
 * Without one: Watch → Recognize → Culture (lessons), Recognize (quiz, review).
 * Pure; pass `rng` for deterministic output. See lessonPlan.md.
 */
import { isRecognizable, type Item } from "../recognition";
import { ALL_ITEMS, findLesson, type CultureNote, type Lesson } from "./curriculum";
import { itemKey } from "./signContent";

export type RecognizeQuestion = {
  item: Item;
  /** 4 choices (fewer only if the whole course has fewer of this kind), same kind as item, includes item, shuffled */
  choices: Item[];
};

/** "camera" is the default; "watch" is the layout for devices without a usable camera. */
export type LessonMode = "camera" | "watch";

export type SignTask = {
  item: Item;
  /** same-kind recognizable items from the lesson (item included); never letters and digits mixed */
  allowed: Item[];
};

/** `allowed: null` = no recognizer for this item yet, so the card is watch-only. */
export type LearnTask = { item: Item; allowed: Item[] | null };

export type Step =
  /** camera mode: watch the clip and sign along, every item in curriculum order */
  | { kind: "learn"; tasks: LearnTask[] }
  /** watch mode: the clips only */
  | { kind: "watch"; items: Item[] }
  | { kind: "recognize"; questions: RecognizeQuestion[] }
  /** camera mode recall: the word is shown, the clip is behind a hint. Only isRecognizable items; omitted if none [S.30] */
  | { kind: "sign"; tasks: SignTask[] }
  /** omitted when the lesson has no note [S.26] */
  | { kind: "culture"; note: CultureNote };

export type StepKind = Step["kind"];

export type LessonPlan = { lesson: Lesson; steps: Step[] };

export const CHOICE_COUNT = 4;

/** Quiz / review sample sizes. The full item lists (65+ for a unit quiz) are too long for one sitting. */
export const QUIZ_RECOGNIZE_CAP = 20;
export const QUIZ_SIGN_CAP = 10;

/** Small seeded PRNG (mulberry32), uniform in [0, 1). Same seed → same plan, which is what lets a lesson resume. */
export function seededRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A random non-negative int32, for seededRng. */
export const newSeed = (): number => Math.floor(Math.random() * 0x7fffffff);

export function shuffle<T>(xs: readonly T[], rng: () => number): T[] {
  const out = [...xs];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function dedupe(items: readonly Item[]): Item[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = itemKey(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const sameKind = (items: readonly Item[], kind: Item["kind"]) => items.filter((i) => i.kind === kind);

/**
 * Distractors come from the lesson's own items of the same kind first, then from the rest of the course, so a
 * small lesson still gets 4 choices. Signs never sit next to letters or numbers as choices.
 */
export function recognizeQuestion(item: Item, lessonItems: readonly Item[], rng: () => number): RecognizeQuestion {
  const key = itemKey(item);
  const notItem = (i: Item) => itemKey(i) !== key;
  const local = shuffle(sameKind(lessonItems, item.kind).filter(notItem), rng);
  const localKeys = new Set(local.map(itemKey));
  const course = shuffle(
    sameKind(ALL_ITEMS, item.kind).filter((i) => notItem(i) && !localKeys.has(itemKey(i))),
    rng,
  );
  const distractors = [...local, ...course].slice(0, CHOICE_COUNT - 1);
  return { item, choices: shuffle([item, ...distractors], rng) };
}

/** `allowed` for an item: every recognizable item of the same kind in `pool` (the whole lesson, not a sample). */
export function allowedFor(item: Item, pool: readonly Item[]): Item[] {
  return sameKind(pool.filter(isRecognizable), item.kind);
}

export const signTasks = (items: readonly Item[], pool: readonly Item[]): SignTask[] =>
  items.filter(isRecognizable).map((item) => ({ item, allowed: allowedFor(item, pool) }));

const learnTasks = (items: readonly Item[]): LearnTask[] =>
  items.map((item) => ({ item, allowed: isRecognizable(item) ? allowedFor(item, items) : null }));

/**
 * A quiz's items split by the lesson they come from (first covering lesson wins). Items that no covered lesson has
 * form one more group, so nothing is lost if `covers` and `items` ever disagree.
 */
function groupsByLesson(lesson: Lesson, items: readonly Item[]): Item[][] {
  const wanted = new Set(items.map(itemKey));
  const taken = new Set<string>();
  const groups = lesson.covers.map((id) =>
    dedupe(findLesson(id)?.items ?? []).filter((item) => {
      const key = itemKey(item);
      if (!wanted.has(key) || taken.has(key)) return false;
      taken.add(key);
      return true;
    }),
  );
  groups.push(items.filter((item) => !taken.has(itemKey(item))));
  return groups.filter((g) => g.length > 0);
}

/**
 * Up to `cap` items, taken round-robin across groups so one big lesson (1.2's 26 letters) can't crowd out the
 * others. Group order is shuffled too, so leftover slots don't always go to the first lessons. Result is shuffled.
 */
function sampleEvenly(groups: readonly Item[][], cap: number, rng: () => number): Item[] {
  const queues = shuffle(groups.map((g) => shuffle(g, rng)), rng);
  const out: Item[] = [];
  while (out.length < cap && queues.some((q) => q.length > 0)) {
    for (const q of queues) {
      const item = q.shift();
      if (item && out.length < cap) out.push(item);
    }
  }
  return shuffle(out, rng);
}

export function buildLessonPlan(lesson: Lesson, rng: () => number = Math.random, mode: LessonMode = "camera"): LessonPlan {
  const items = dedupe(lesson.items);
  if (items.length === 0) return { lesson, steps: [] };

  // Lessons: every item; learn and sign in curriculum order, quiz in random order.
  // Quizzes / reviews: an even sample across the covered lessons, shuffled; `allowed` still spans every item.
  // Everything is built in both modes so the rng sequence (and so the Recognize questions) is the same for a seed,
  // which is what lets a session switch modes and keep its answers (lessonSession.remapSession).
  const isLesson = lesson.kind === "lesson";
  const groups = isLesson ? [] : groupsByLesson(lesson, items);
  const recognizeItems = isLesson ? shuffle(items, rng) : sampleEvenly(groups, QUIZ_RECOGNIZE_CAP, rng);
  const signItems = isLesson ? items : sampleEvenly(groups.map((g) => g.filter(isRecognizable)), QUIZ_SIGN_CAP, rng);
  const questions = recognizeItems.map((item) => recognizeQuestion(item, items, rng));
  const tasks = signTasks(signItems, items);
  const camera = mode === "camera";

  const steps: Step[] = [];
  if (isLesson) steps.push(camera ? { kind: "learn", tasks: learnTasks(items) } : { kind: "watch", items });
  steps.push({ kind: "recognize", questions });
  if (camera && tasks.length > 0) steps.push({ kind: "sign", tasks });
  if (isLesson && lesson.culture) steps.push({ kind: "culture", note: lesson.culture });
  return { lesson, steps };
}

/** Items / questions / tasks in a step; a culture step counts as 1. */
export function stepItemCount(step: Step): number {
  switch (step.kind) {
    case "learn":
      return step.tasks.length;
    case "watch":
      return step.items.length;
    case "recognize":
      return step.questions.length;
    case "sign":
      return step.tasks.length;
    case "culture":
      return 1;
  }
}
