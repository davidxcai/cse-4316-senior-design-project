import { useMemo } from "react";
import { UNITS, type Unit } from "../../../domain/curriculum";
import { practiceItems } from "../../../domain/practice";
import { useCompletions } from "../../../hooks/useCompletions";

export type PracticeUnit = { unit: Unit; signs: number };

/** Every unit with the number of words the user can practice in it (from completed lessons; 0 = not yet). */
export function usePracticeUnits(): { data: PracticeUnit[] | undefined; isPending: boolean; error: Error | null } {
  const { data, isPending, error } = useCompletions();
  const units = useMemo(() => {
    if (!data) return undefined;
    const completed = new Set(data.map((c) => c.lessonId));
    return UNITS.filter((u) => u.lessons.length > 0).map((unit) => ({ unit, signs: practiceItems(unit, completed).length }));
  }, [data]);
  return { data: units, isPending, error };
}
