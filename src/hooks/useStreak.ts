import { useMemo } from "react";
import { localDayKey, streakSummary, type StreakSummary } from "../domain/streak";
import { useCompletions } from "./useCompletions";

/** Week strip + current/best streak for Home. Recomputed when completions change or on the first render of a new day. */
export function useStreak(): { data: StreakSummary | undefined; isPending: boolean; error: Error | null } {
  const { data, isPending, error } = useCompletions();
  const today = localDayKey(new Date());
  const summary = useMemo(
    () => (data ? streakSummary(data.map((c) => c.completedAt), new Date()) : undefined),
    // `today` is a dependency on purpose: it rolls the week/current streak over at midnight.
    [data, today],
  );
  return { data: summary, isPending, error };
}
