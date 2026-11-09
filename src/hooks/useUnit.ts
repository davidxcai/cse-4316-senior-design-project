import { useMemo } from "react";
import { findUnit, type Lesson } from "../domain/curriculum";
import { lessonRowStatuses, unitProgress, type LessonRowStatus, type UnitProgress } from "../domain/progress";
import { useCompletions } from "./useCompletions";

export type { LessonRowStatus };

export type UnitView = { progress: UnitProgress; rows: { lesson: Lesson; status: LessonRowStatus }[] };

/** Unit page data [L.2–8]: the unit's progress and each row's status. `notFound` = no unit with this id. */
export function useUnit(unitId: number): {
  data: UnitView | undefined;
  isPending: boolean;
  error: Error | null;
  notFound: boolean;
} {
  const { data: completions, isPending, error } = useCompletions();
  const result = useMemo(() => {
    if (!completions) return undefined;
    const completed = new Set(completions.map((c) => c.lessonId));
    const progress = unitProgress(completed).find((u) => u.unit.id === unitId);
    if (!progress) return undefined;
    const statuses = lessonRowStatuses(progress, completed);
    return { progress, rows: progress.unit.lessons.map((lesson, i) => ({ lesson, status: statuses[i] })) };
  }, [completions, unitId]);
  return { data: result, isPending, error, notFound: !findUnit(unitId) };
}
