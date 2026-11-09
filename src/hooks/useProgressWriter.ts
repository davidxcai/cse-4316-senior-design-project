import { useCallback, useEffect, useRef } from "react";
import { clearLessonProgress, saveLessonProgress, type LessonProgress } from "../api/lessonProgress";
import type { LessonMode } from "../domain/lessonPlan";

type Saved = LessonProgress & { mode: LessonMode };

const DEBOUNCE_MS = 400;

/**
 * Debounced, serialized writes of one lesson's resume point. Every save/clear runs after the previous one
 * finishes, so a late save can never land after the clear on completion and resurrect the row.
 * A pending save is flushed when the lesson changes or the page unmounts. Write errors are logged, not thrown:
 * losing a resume point is not worth interrupting the lesson.
 */
export function useProgressWriter(lessonId: string) {
  const chain = useRef<Promise<void>>(Promise.resolve());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<Saved | null>(null);

  const enqueue = useCallback((task: () => Promise<void>) => {
    const next = chain.current.then(task).catch((e: unknown) => console.warn("lesson_progress write failed", e));
    chain.current = next;
    return next;
  }, []);

  const flush = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    const p = pending.current;
    pending.current = null;
    if (p) void enqueue(() => saveLessonProgress(lessonId, p));
  }, [enqueue, lessonId]);

  const save = useCallback(
    (p: Saved) => {
      pending.current = p;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(flush, DEBOUNCE_MS);
    },
    [flush],
  );

  /** Drops any pending save, then deletes the row. Resolves once every earlier write has finished. */
  const clear = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    pending.current = null;
    return enqueue(() => clearLessonProgress(lessonId));
  }, [enqueue, lessonId]);

  useEffect(() => flush, [flush]);

  return { save, clear };
}
