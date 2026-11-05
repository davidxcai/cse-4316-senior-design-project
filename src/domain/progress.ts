/** Unit status, unlocking and resume target, derived from the set of completed lesson ids. Pure. See domain.md. */
import { UNITS, type Unit } from "./curriculum";

export type UnitStatus = "completed" | "in-progress" | "not-started" | "locked";

export type UnitProgress = {
  unit: Unit;
  status: UnitStatus;
  /** rows (lessons + quiz + review) with at least one completion */
  done: number;
  total: number;
  /** 0–100, rounded down so a unit never shows 100 until it is complete */
  percent: number;
  /** first row not done, in an unlocked unit; null when locked or completed */
  currentLessonId: string | null;
};

/**
 * Sequential unlocking [5.11]: unit 1 is always open; unit N opens once unit N-1 is completed.
 * A unit that already has completions also counts as open, so adding a lesson to an earlier unit
 * never re-locks work the user has already done.
 */
export function unitProgress(completed: ReadonlySet<string>): UnitProgress[] {
  let previousCompleted = true;
  return UNITS.map((unit) => {
    const total = unit.lessons.length;
    const done = unit.lessons.filter((l) => completed.has(l.id)).length;
    const isComplete = done === total;
    const unlocked = previousCompleted || done > 0;
    previousCompleted = isComplete;

    const status: UnitStatus =
      !unlocked ? "locked" : isComplete ? "completed" : done > 0 ? "in-progress" : "not-started";
    const currentLessonId =
      unlocked && !isComplete ? (unit.lessons.find((l) => !completed.has(l.id))?.id ?? null) : null;

    return {
      unit,
      status,
      done,
      total,
      percent: total === 0 ? 0 : Math.floor((done / total) * 100),
      currentLessonId,
    };
  });
}

/** The first unlocked, unfinished unit and its current lesson; null when everything is done. */
export function resumeTarget(units: UnitProgress[]): { unitId: number; lessonId: string } | null {
  const next = units.find((u) => u.status !== "locked" && u.status !== "completed" && u.currentLessonId);
  return next?.currentLessonId ? { unitId: next.unit.id, lessonId: next.currentLessonId } : null;
}
