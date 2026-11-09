import { IconArrowRight, IconCheck, IconFlame, IconHandStop, IconListDetails, IconRefresh } from "@tabler/icons-react";
import { Link } from "@tanstack/react-router";
import SessionSummary from "../../../components/SessionSummary";
import type { Lesson } from "../../../domain/curriculum";
import { useUnit } from "../../../hooks/useUnit";
import type { useLessonSession } from "../../../hooks/useLessonSession";

type Props = {
  lesson: Lesson;
  stats: NonNullable<ReturnType<typeof useLessonSession>["completed"]>;
  onRedo: () => void;
};

/** Completion screen [S.27–S.29]: stats, Redo, and the next row of the unit (or back to the unit when it was the last). */
export default function LessonComplete({ lesson, stats, onRedo }: Props) {
  const { data } = useUnit(lesson.unitId);
  const rows = data?.rows ?? [];
  const at = rows.findIndex((r) => r.lesson.id === lesson.id);
  const next = at >= 0 ? rows[at + 1]?.lesson : undefined;

  return (
    <SessionSummary
      title={
        <>
          {lesson.label && <span className="mr-2 text-base-content/60">{lesson.label}</span>}
          {lesson.title}
        </>
      }
      stats={[
        { icon: IconHandStop, value: stats.signs, label: "Signs" },
        { icon: IconCheck, value: `${stats.correct}/${stats.total}`, label: "Correct" },
        { icon: IconFlame, value: stats.streak, label: "Streak" },
      ]}
    >
      <button type="button" className="btn btn-ghost" onClick={onRedo}>
        <IconRefresh size={20} />
        Redo
      </button>
      {next ? (
        <Link to="/lesson/$lessonId" params={{ lessonId: next.id }} className="btn btn-primary">
          Next lesson
          <IconArrowRight size={20} />
        </Link>
      ) : (
        <Link to="/unit/$unitId" params={{ unitId: String(lesson.unitId) }} className="btn btn-primary btn-square" aria-label="Unit">
          <IconListDetails size={20} />
        </Link>
      )}
    </SessionSummary>
  );
}
