import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { findUnit } from "../../../domain/curriculum";
import type { LessonMode } from "../../../domain/lessonPlan";
import type { AttemptVerdict } from "../../../domain/lessonSession";
import * as P from "../../../domain/practice";
import type { Item } from "../../../recognition";
import { useCameraAvailable } from "../../../hooks/useCameraAvailable";
import { useCompletions } from "../../../hooks/useCompletions";

export type PracticeStatus = "loading" | "ready" | "empty" | "not-found" | "error";

/**
 * Unit practice session: deals rounds from domain/practice.ts until the learner stops. Nothing is saved; leaving
 * the page ends the session. Camera vs watch layout is decided once, when the session starts.
 */
export function usePracticeSession(unitId: number) {
  const unit = findUnit(unitId);
  const completions = useCompletions();
  const cameraAvailable = useCameraAvailable();
  const items = useMemo(
    () => (unit && completions.data ? P.practiceItems(unit, new Set(completions.data.map((c) => c.lessonId))) : null),
    [unit, completions.data],
  );

  const [mode, setMode] = useState<LessonMode | null>(null);
  const [state, setState] = useState<P.PracticeState | null>(null);
  const [stopped, setStopped] = useState(false);
  // Mirror so actions read the latest state synchronously.
  const ref = useRef<P.PracticeState | null>(null);
  const commit = useCallback((next: P.PracticeState) => {
    ref.current = next;
    setState(next);
  }, []);

  useEffect(() => {
    if (!items || cameraAvailable === null || mode) return;
    const m: LessonMode = cameraAvailable ? "camera" : "watch";
    setMode(m);
    commit(P.startPractice(items, m));
  }, [items, cameraAvailable, mode, commit]);

  const act = useCallback(
    (change: (s: P.PracticeState) => P.PracticeState) => {
      if (ref.current) commit(change(ref.current));
    },
    [commit],
  );

  const next = useCallback(() => {
    if (items && mode) act((s) => P.nextCard(s, items, mode));
  }, [act, items, mode]);
  const answerRecognize = useCallback((choice: Item) => act((s) => P.answerRecognize(s, choice)), [act]);
  const recordSign = useCallback((v: AttemptVerdict) => act((s) => P.recordSign(s, v)), [act]);
  const showSignHint = useCallback(() => act(P.showSignHint), [act]);
  const switchToWatch = useCallback(() => {
    if (!items || mode !== "camera") return;
    setMode("watch");
    act((s) => P.toWatch(s, items));
  }, [act, items, mode]);

  const stop = useCallback(() => setStopped(true), []);
  const restart = useCallback(() => {
    if (!items || !mode) return;
    commit(P.startPractice(items, mode));
    setStopped(false);
  }, [commit, items, mode]);

  const status: PracticeStatus = !unit
    ? "not-found"
    : completions.error
      ? "error"
      : !items || !mode || !state
        ? "loading"
        : P.hasCards(items, mode)
          ? "ready"
          : "empty";

  return {
    status,
    unit,
    card: state ? P.currentCard(state) : undefined,
    index: state?.index ?? 0,
    answer: state?.answer ?? null,
    signRecord: state?.sign ?? null,
    correct: state?.correct ?? 0,
    practiced: state?.practiced.length ?? 0,
    canNext: !!state && P.canNext(state),
    stopped,
    next,
    answerRecognize,
    recordSign,
    showSignHint,
    switchToWatch,
    stop,
    restart,
  };
}
