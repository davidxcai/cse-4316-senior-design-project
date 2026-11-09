import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { lessonProgressQueryOptions } from "../api/lessonProgress";
import { completeLesson, completionKeys, type Completion } from "../api/progress";
import { recordWeakMiss, weakSignKeys } from "../api/weakSigns";
import { findLesson } from "../domain/curriculum";
import { buildLessonPlan, newSeed, seededRng, type LessonMode, type LessonPlan } from "../domain/lessonPlan";
import * as S from "../domain/lessonSession";
import { lessonRowStatuses, unitProgress } from "../domain/progress";
import { streakSummary } from "../domain/streak";
import type { Item } from "../recognition";
import { useAuth } from "./useAuth";
import { useCameraAvailable } from "./useCameraAvailable";
import { useCompletions } from "./useCompletions";
import { useProgressWriter } from "./useProgressWriter";

export type LessonCompleted = { signs: number; correct: number; total: number; streak: number };

export type LessonSessionStatus = "loading" | "ready" | "not-found" | "locked" | "error";

type Session = { lessonId: string; seed: number; mode: LessonMode; plan: LessonPlan; state: S.SessionState };

type Resume = { mode: LessonMode | null; state: S.SessionState };

/**
 * A new session, or a resumed one. A resume point saved in the other mode is remapped onto this mode's plan
 * (same seed, so Recognize answers carry over); one saved before modes existed (`mode: null`) restarts.
 */
function startSession(lessonId: string, seed: number, mode: LessonMode, resume?: Resume): Session | null {
  const lesson = findLesson(lessonId);
  if (!lesson) return null;
  const plan = buildLessonPlan(lesson, seededRng(seed), mode);
  let state = S.initialSession();
  if (resume?.mode === mode) state = S.fitSession(plan, resume.state);
  else if (resume?.mode) {
    const from = buildLessonPlan(lesson, seededRng(seed), resume.mode);
    state = S.fitSession(plan, S.remapSession(from, plan, S.fitSession(from, resume.state)));
  }
  return { lessonId, seed, mode, plan, state };
}

/** Lesson page step machine [3a–3f]. Rules live in domain/lessonSession.ts; this hook loads, persists and completes. */
export function useLessonSession(lessonId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const lesson = findLesson(lessonId);
  const completions = useCompletions();
  const saved = useQuery({ ...lessonProgressQueryOptions(user?.id ?? "", lessonId), enabled: !!user && !!lesson });
  const writer = useProgressWriter(lessonId);
  const cameraAvailable = useCameraAvailable();

  const [session, setSession] = useState<Session | null>(null);
  const [completed, setCompleted] = useState<LessonCompleted | null>(null);
  const [completing, setCompleting] = useState(false);
  const [completeError, setCompleteError] = useState<Error | null>(null);
  // Mirror of `session` so actions can read the latest value synchronously (answerRecognize returns a verdict).
  const ref = useRef<Session | null>(null);
  const live = session?.lessonId === lessonId ? session : null;

  // Start (or resume) once the saved position and the camera check are in, and again whenever the route's lessonId
  // changes. The mode is fixed for the session after that; only switchToWatch() changes it.
  useEffect(() => {
    if (!saved.isSuccess || cameraAvailable === null || live) return;
    const p = saved.data;
    const mode: LessonMode = cameraAvailable ? "camera" : "watch";
    const next = p
      ? startSession(lessonId, p.seed, mode, { mode: p.mode, state: { stepIndex: p.stepIndex, itemIndex: p.itemIndex, answers: p.answers } })
      : startSession(lessonId, newSeed(), mode);
    ref.current = next;
    setSession(next);
    setCompleted(null);
    setCompleteError(null);
  }, [saved.isSuccess, saved.data, cameraAvailable, live, lessonId]);

  const save = useCallback(
    (cur: Session) =>
      writer.save({ stepIndex: cur.state.stepIndex, itemIndex: cur.state.itemIndex, seed: cur.seed, mode: cur.mode, answers: cur.state.answers }),
    [writer],
  );

  const commit = useCallback(
    (state: S.SessionState) => {
      const cur = ref.current;
      if (!cur || state === cur.state) return;
      const next = { ...cur, state };
      ref.current = next;
      setSession(next);
      save(next);
    },
    [save],
  );

  const complete = useCallback(async () => {
    const cur = ref.current;
    if (!cur || completing) return;
    setCompleting(true);
    setCompleteError(null);
    try {
      const done = await completeLesson(cur.lessonId);
      await writer.clear();
      const previous = user ? (queryClient.getQueryData<Completion[]>(completionKeys.list(user.id)) ?? []) : [];
      const streak = streakSummary([...previous.map((c) => c.completedAt), done.completedAt], new Date()).current;
      setCompleted({ ...S.sessionStats(cur.plan, cur.state), streak });
      void queryClient.invalidateQueries({ queryKey: completionKeys.all });
    } catch (e) {
      setCompleteError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setCompleting(false);
    }
  }, [completing, queryClient, user, writer]);

  const next = useCallback(() => {
    const cur = ref.current;
    if (!cur || completed) return;
    const { state, finished } = S.moveNext(cur.plan, cur.state);
    if (finished) void complete();
    else commit(state);
  }, [commit, complete, completed]);

  const prev = useCallback(() => {
    const cur = ref.current;
    if (cur && !completed) commit(S.movePrev(cur.plan, cur.state));
  }, [commit, completed]);

  const answerRecognize = useCallback(
    (choice: Item): { correct: boolean } => {
      const cur = ref.current;
      if (!cur) return { correct: false };
      const { state, correct } = S.answerRecognize(cur.plan, cur.state, choice);
      commit(state);
      return { correct };
    },
    [commit],
  );

  const recordLearn = useCallback(
    (verdict: S.AttemptVerdict) => {
      const cur = ref.current;
      if (cur) commit(S.recordLearn(cur.plan, cur.state, verdict));
    },
    [commit],
  );

  /** Commits a Sign change; its first miss (or the hint) adds the item to weak_signs in the background [S.23]. */
  const commitSign = useCallback(
    (change: (plan: LessonPlan, s: S.SessionState) => { state: S.SessionState; newMiss: boolean }) => {
      const cur = ref.current;
      const step = cur ? S.currentStep(cur.plan, cur.state) : undefined;
      if (!cur || step?.kind !== "sign") return;
      const { state, newMiss } = change(cur.plan, cur.state);
      commit(state);
      if (newMiss) {
        recordWeakMiss(step.tasks[cur.state.itemIndex].item)
          .then(() => queryClient.invalidateQueries({ queryKey: weakSignKeys.all }))
          .catch((e: unknown) => console.warn("weak_signs update failed", e));
      }
    },
    [commit, queryClient],
  );

  const recordSign = useCallback(
    (verdict: S.AttemptVerdict) => commitSign((plan, s) => S.recordSign(plan, s, verdict)),
    [commitSign],
  );

  const showSignHint = useCallback(() => commitSign(S.showSignHint), [commitSign]);

  /** The camera can't be used (blocked, unplugged, model failed): continue this session in the watch layout. */
  const switchToWatch = useCallback(() => {
    const cur = ref.current;
    if (!cur || cur.mode === "watch" || completed) return;
    const lesson = findLesson(cur.lessonId);
    if (!lesson) return;
    const plan = buildLessonPlan(lesson, seededRng(cur.seed), "watch");
    const next: Session = { ...cur, mode: "watch", plan, state: S.remapSession(cur.plan, plan, cur.state) };
    ref.current = next;
    setSession(next);
    save(next);
  }, [completed, save]);

  const redo = useCallback(() => {
    void writer.clear();
    const next = startSession(lessonId, newSeed(), ref.current?.mode ?? (cameraAvailable === false ? "watch" : "camera"));
    ref.current = next;
    setSession(next);
    setCompleted(null);
    setCompleteError(null);
  }, [cameraAvailable, lessonId, writer]);

  const locked = useMemo(() => {
    if (!lesson || !completions.data) return false;
    const done = new Set(completions.data.map((c) => c.lessonId));
    const unit = unitProgress(done).find((u) => u.unit.id === lesson.unitId);
    if (!unit) return true;
    return lessonRowStatuses(unit, done)[unit.unit.lessons.findIndex((l) => l.id === lesson.id)] === "locked";
  }, [completions.data, lesson]);

  const status: LessonSessionStatus = !lesson
    ? "not-found"
    : completions.error || saved.error
      ? "error"
      : !completions.data || !live
        ? "loading"
        : locked && !completed
          ? "locked"
          : "ready";

  const plan = live?.plan;
  const state = live?.state ?? S.initialSession();
  return {
    status,
    plan,
    mode: live?.mode ?? "camera",
    stepIndex: state.stepIndex,
    itemIndex: state.itemIndex,
    stepCount: plan?.steps.length ?? 0,
    itemCount: plan ? S.currentItemCount(plan, state) : 0,
    canPrev: !!plan && !completed && S.canPrev(plan, state),
    canNext: !!plan && !completed && !completing && S.canNext(plan, state),
    prev,
    next,
    answerRecognize,
    recognizeAnswer: S.recognizeAnswerOf(state),
    recordLearn,
    learnReps: S.learnRepsOf(state),
    recordSign,
    showSignHint,
    signRecord: S.signRecordOf(state),
    switchToWatch,
    completed,
    /** true while next() on the last item is saving the completion */
    completing,
    /** the completion insert failed; canNext is true again so next() retries */
    completeError,
    redo,
  };
}
