/**
 * The lesson step machine: position, answers, gating and score. Pure; useLessonSession stores and persists it.
 * See lessonPlan.md.
 */
import type { Item } from "../recognition";
import { stepItemCount, type LessonMode, type LessonPlan, type Step, type StepKind } from "./lessonPlan";
import { itemFromKey, itemKey } from "./signContent";

/** Correct signs (not necessarily in a row) a Learn card asks for before Next unlocks. */
export const LEARN_REPS = 3;

export type AttemptVerdict = "correct" | "wrong" | "rejected";

/**
 * A Sign (recall) task. `correct` unlocks Next. `hinted` = the clip was opened before the first correct sign, so it
 * doesn't count toward the score. `missed` = a miss or the hint was already sent to weak_signs (once per task).
 */
export type SignRecord = { correct: boolean; hinted: boolean; missed: boolean };

export type SessionAnswers = {
  /** `${stepIndex}:${itemIndex}` → the first choice picked */
  recognize: Record<string, Item>;
  /** `${stepIndex}:${itemIndex}` → correct signs on a Learn card so far */
  learn: Record<string, number>;
  /** `${stepIndex}:${itemIndex}` → Sign task state */
  sign: Record<string, SignRecord>;
};

export type SessionState = { stepIndex: number; itemIndex: number; answers: SessionAnswers };

export const emptyAnswers = (): SessionAnswers => ({ recognize: {}, learn: {}, sign: {} });

export const initialSession = (): SessionState => ({ stepIndex: 0, itemIndex: 0, answers: emptyAnswers() });

const slot = (s: Pick<SessionState, "stepIndex" | "itemIndex">) => `${s.stepIndex}:${s.itemIndex}`;

export const currentStep = (plan: LessonPlan, s: SessionState): Step | undefined => plan.steps[s.stepIndex];

export const currentItemCount = (plan: LessonPlan, s: SessionState): number => {
  const step = currentStep(plan, s);
  return step ? stepItemCount(step) : 0;
};

/** A saved position that no longer fits the plan (the curriculum changed) restarts the lesson. */
export function fitSession(plan: LessonPlan, s: SessionState): SessionState {
  const step = plan.steps[s.stepIndex];
  const fits =
    Number.isInteger(s.stepIndex) && Number.isInteger(s.itemIndex) && s.itemIndex >= 0 && !!step && s.itemIndex < stepItemCount(step);
  return fits ? s : initialSession();
}

/** Learn (camera) and Watch are the same step in the two modes; every other kind maps to itself. */
const modeless = (kind: StepKind): StepKind => (kind === "watch" ? "learn" : kind);

/**
 * Moves a session to the same lesson's plan in another mode (same seed, so Recognize is identical). Answers follow
 * their step; the position moves to the matching step, or the start of the next step that exists in `to` (Sign has
 * no Watch-mode counterpart). Past the last one, it lands on the last item so Next finishes.
 */
export function remapSession(from: LessonPlan, to: LessonPlan, s: SessionState): SessionState {
  if (to.steps.length === 0) return initialSession();
  const target = (i: number) => {
    const kind = from.steps[i] && modeless(from.steps[i].kind);
    return kind ? to.steps.findIndex((step) => modeless(step.kind) === kind) : -1;
  };
  const move = <T>(rec: Record<string, T>, keep: (toIndex: number) => boolean): Record<string, T> => {
    const out: Record<string, T> = {};
    for (const [key, value] of Object.entries(rec)) {
      const [i, j] = key.split(":").map(Number);
      const t = target(i);
      if (t >= 0 && keep(t)) out[`${t}:${j}`] = value;
    }
    return out;
  };
  const kindAt = (t: number) => to.steps[t].kind;
  const answers: SessionAnswers = {
    recognize: move(s.answers.recognize, (t) => kindAt(t) === "recognize"),
    learn: move(s.answers.learn, (t) => kindAt(t) === "learn"),
    sign: move(s.answers.sign, (t) => kindAt(t) === "sign"),
  };
  for (let k = s.stepIndex; k < from.steps.length; k++) {
    const t = target(k);
    if (t < 0) continue;
    const itemIndex = k === s.stepIndex ? Math.min(s.itemIndex, stepItemCount(to.steps[t]) - 1) : 0;
    return { stepIndex: t, itemIndex, answers };
  }
  const last = to.steps.length - 1;
  return { stepIndex: last, itemIndex: stepItemCount(to.steps[last]) - 1, answers };
}

export const recognizeAnswerOf = (s: SessionState): Item | null => s.answers.recognize[slot(s)] ?? null;

export const learnRepsOf = (s: SessionState): number => s.answers.learn[slot(s)] ?? 0;

export const signRecordOf = (s: SessionState): SignRecord | null => s.answers.sign[slot(s)] ?? null;

export const canPrev = (plan: LessonPlan, s: SessionState): boolean =>
  plan.steps.length > 0 && (s.stepIndex > 0 || s.itemIndex > 0);

/**
 * Recognize waits for an answer. A Learn card waits for LEARN_REPS correct signs (watch-only cards don't wait).
 * A Sign task waits for one correct sign; tries are unlimited and the hint is always there. Watch and Culture never block.
 */
export function canNext(plan: LessonPlan, s: SessionState): boolean {
  const step = currentStep(plan, s);
  if (!step) return false;
  switch (step.kind) {
    case "recognize":
      return recognizeAnswerOf(s) !== null;
    case "learn":
      return step.tasks[s.itemIndex]?.allowed === null || learnRepsOf(s) >= LEARN_REPS;
    case "sign":
      return signRecordOf(s)?.correct === true;
    default:
      return true;
  }
}

export const isLastPosition = (plan: LessonPlan, s: SessionState): boolean =>
  s.stepIndex === plan.steps.length - 1 && s.itemIndex === currentItemCount(plan, s) - 1;

/** `finished` = next() was pressed on the last item of the last step; the caller completes the lesson. */
export function moveNext(plan: LessonPlan, s: SessionState): { state: SessionState; finished: boolean } {
  if (!canNext(plan, s)) return { state: s, finished: false };
  if (isLastPosition(plan, s)) return { state: s, finished: true };
  if (s.itemIndex < currentItemCount(plan, s) - 1) return { state: { ...s, itemIndex: s.itemIndex + 1 }, finished: false };
  return { state: { ...s, stepIndex: s.stepIndex + 1, itemIndex: 0 }, finished: false };
}

export function movePrev(plan: LessonPlan, s: SessionState): SessionState {
  if (!canPrev(plan, s)) return s;
  if (s.itemIndex > 0) return { ...s, itemIndex: s.itemIndex - 1 };
  const stepIndex = s.stepIndex - 1;
  return { ...s, stepIndex, itemIndex: stepItemCount(plan.steps[stepIndex]) - 1 };
}

/** Records the first answer only; later calls return the original verdict unchanged. */
export function answerRecognize(plan: LessonPlan, s: SessionState, choice: Item): { state: SessionState; correct: boolean } {
  const step = currentStep(plan, s);
  if (step?.kind !== "recognize") return { state: s, correct: false };
  const target = itemKey(step.questions[s.itemIndex].item);
  const existing = recognizeAnswerOf(s);
  if (existing) return { state: s, correct: itemKey(existing) === target };
  const state = { ...s, answers: { ...s.answers, recognize: { ...s.answers.recognize, [slot(s)]: choice } } };
  return { state, correct: itemKey(choice) === target };
}

/** A correct sign on a Learn card adds a rep. Misses change nothing: first tries are practice. */
export function recordLearn(plan: LessonPlan, s: SessionState, verdict: AttemptVerdict): SessionState {
  const step = currentStep(plan, s);
  if (step?.kind !== "learn" || !step.tasks[s.itemIndex]?.allowed || verdict !== "correct") return s;
  return { ...s, answers: { ...s.answers, learn: { ...s.answers.learn, [slot(s)]: learnRepsOf(s) + 1 } } };
}

const putSign = (s: SessionState, record: SignRecord): SessionState => ({
  ...s,
  answers: { ...s.answers, sign: { ...s.answers.sign, [slot(s)]: record } },
});

const NO_SIGN: SignRecord = { correct: false, hinted: false, missed: false };

/** `newMiss` = the first miss on this task; the caller sends it to weak_signs. */
export function recordSign(plan: LessonPlan, s: SessionState, verdict: AttemptVerdict): { state: SessionState; newMiss: boolean } {
  if (currentStep(plan, s)?.kind !== "sign") return { state: s, newMiss: false };
  const rec = signRecordOf(s) ?? NO_SIGN;
  if (rec.correct) return { state: s, newMiss: false };
  if (verdict === "correct") return { state: putSign(s, { ...rec, correct: true }), newMiss: false };
  if (rec.missed) return { state: s, newMiss: false };
  return { state: putSign(s, { ...rec, missed: true }), newMiss: true };
}

/** Opens the clip. Before the first correct sign it counts as not recalled (and as a miss for weak_signs). */
export function showSignHint(plan: LessonPlan, s: SessionState): { state: SessionState; newMiss: boolean } {
  if (currentStep(plan, s)?.kind !== "sign") return { state: s, newMiss: false };
  const rec = signRecordOf(s) ?? NO_SIGN;
  if (rec.correct || rec.hinted) return { state: s, newMiss: false };
  return { state: putSign(s, { ...rec, hinted: true, missed: true }), newMiss: !rec.missed };
}

/**
 * Completion stats [S.28]. total = Recognize questions + Sign tasks; correct = first Recognize answers that were
 * right + Sign tasks signed correctly without the hint. Learn is practice and isn't scored. signs = distinct items.
 */
export function sessionStats(plan: LessonPlan, s: SessionState): { signs: number; correct: number; total: number } {
  let correct = 0;
  let total = 0;
  plan.steps.forEach((step, stepIndex) => {
    if (step.kind === "recognize") {
      step.questions.forEach((q, itemIndex) => {
        total++;
        const a = s.answers.recognize[slot({ stepIndex, itemIndex })];
        if (a && itemKey(a) === itemKey(q.item)) correct++;
      });
    } else if (step.kind === "sign") {
      step.tasks.forEach((_, itemIndex) => {
        total++;
        const rec = s.answers.sign[slot({ stepIndex, itemIndex })];
        if (rec?.correct && !rec.hinted) correct++;
      });
    }
  });
  const signs = new Set(plan.lesson.items.map(itemKey)).size;
  return { signs, correct, total };
}

// ---------------------------------------------------------------------------
// Persistence shape (lesson_progress.answers). Items are stored as item keys. `m` is the mode the positions refer to.
// ---------------------------------------------------------------------------

type StoredSign = { c: boolean; h: boolean; x: boolean };
export type StoredAnswers = { m: LessonMode; r: Record<string, string>; l: Record<string, number>; s: Record<string, StoredSign> };

export function serializeAnswers(a: SessionAnswers, mode: LessonMode): StoredAnswers {
  const r: StoredAnswers["r"] = {};
  for (const [k, item] of Object.entries(a.recognize)) r[k] = itemKey(item);
  const s: StoredAnswers["s"] = {};
  for (const [k, rec] of Object.entries(a.sign)) s[k] = { c: rec.correct, h: rec.hinted, x: rec.missed };
  return { m: mode, r, l: { ...a.learn }, s };
}

const isRecord = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null && !Array.isArray(x);

/**
 * Tolerant: anything malformed is dropped rather than failing the resume. `mode: null` = no mode stored (a row from
 * before Learn/Sign), which the caller treats as a restart.
 */
export function parseAnswers(json: unknown): { mode: LessonMode | null; answers: SessionAnswers } {
  const answers = emptyAnswers();
  if (!isRecord(json)) return { mode: null, answers };
  const mode = json.m === "camera" || json.m === "watch" ? json.m : null;
  if (isRecord(json.r)) {
    for (const [k, v] of Object.entries(json.r)) {
      const item = typeof v === "string" ? itemFromKey(v) : null;
      if (item) answers.recognize[k] = item;
    }
  }
  if (isRecord(json.l)) {
    for (const [k, v] of Object.entries(json.l)) {
      if (typeof v === "number" && Number.isInteger(v) && v > 0) answers.learn[k] = v;
    }
  }
  if (isRecord(json.s)) {
    for (const [k, v] of Object.entries(json.s)) {
      if (isRecord(v)) answers.sign[k] = { correct: v.c === true, hinted: v.h === true, missed: v.x === true };
    }
  }
  return { mode, answers };
}
