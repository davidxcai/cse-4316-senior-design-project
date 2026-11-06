import { itemKey } from "../../../domain/signContent";
import type { UnitView } from "../../../hooks/useUnit";
import LessonRow from "./LessonRow";

/** Distinct signs in a row (quiz and review rows are unions of lessons). */
const distinctCount = (items: UnitView["rows"][number]["lesson"]["items"]) => new Set(items.map(itemKey)).size;

export default function LessonList({ rows }: { rows: UnitView["rows"] }) {
  return (
    <ul className="flex flex-col gap-2">
      {rows.map(({ lesson, status }) => (
        <LessonRow
          key={lesson.id}
          kind={lesson.kind}
          status={status}
          lessonId={lesson.id}
          label={lesson.label}
          title={lesson.title}
          signCount={distinctCount(lesson.items)}
        />
      ))}
    </ul>
  );
}
