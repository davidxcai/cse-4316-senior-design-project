import { useMemo } from "react";
import { unitProgress, type UnitProgress } from "../domain/progress";
import { useCompletions } from "./useCompletions";

/** Per-unit status/progress for Home. Pair with `resumeTarget(data)` for the Resume button. */
export function useUnitOverview(): { data: UnitProgress[] | undefined; isPending: boolean; error: Error | null } {
  const { data, isPending, error } = useCompletions();
  const units = useMemo(() => (data ? unitProgress(new Set(data.map((c) => c.lessonId))) : undefined), [data]);
  return { data: units, isPending, error };
}
