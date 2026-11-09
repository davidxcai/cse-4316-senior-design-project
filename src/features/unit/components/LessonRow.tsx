import { IconArrowRight, IconCheck, IconCircleFilled, IconHandStop, IconLock, IconPencil, IconRefresh } from "@tabler/icons-react";
import { Link } from "@tanstack/react-router";
import type { LessonKind } from "../../../domain/curriculum";
import type { LessonRowStatus } from "../../../hooks/useUnit";

type Props = {
  kind: LessonKind;
  status: LessonRowStatus;
  lessonId: string;
  label: string;
  title: string;
  signCount: number;
};

function StatusIcon({ status }: { status: LessonRowStatus }) {
  if (status === "done") return <IconCheck size={22} className="text-success" aria-label="Done" />;
  if (status === "current") return <IconCircleFilled size={14} className="text-primary" aria-label="Current" />;
  if (status === "locked") return <IconLock size={20} className="text-base-content/50" aria-label="Locked" />;
  return null; // available: the number alone
}

/** One row for a lesson, unit quiz or review [L.4, L.6–8]. Locked rows aren't links; done rows stay openable. */
export default function LessonRow({ kind, status, lessonId, label, title, signCount }: Props) {
  const locked = status === "locked";
  const KindIcon = kind === "quiz" ? IconPencil : kind === "review" ? IconRefresh : null;

  const content = (
    <>
      <span className="flex w-6 shrink-0 justify-center">
        <StatusIcon status={status} />
      </span>
      <span className="flex w-10 shrink-0 justify-center font-semibold text-base-content/70">
        {KindIcon ? <KindIcon size={20} aria-hidden /> : label}
      </span>
      <span className="min-w-0 flex-1 truncate font-semibold">{title}</span>
      {kind === "lesson" && signCount > 0 && (
        <span className="flex shrink-0 items-center gap-1 text-sm text-base-content/70" aria-label={`${signCount} signs`}>
          <IconHandStop size={16} aria-hidden />
          {signCount}
        </span>
      )}
      <span className="flex w-6 shrink-0 justify-center">
        {!locked && <IconArrowRight size={20} aria-hidden />}
      </span>
    </>
  );

  return (
    <li>
      {locked ? (
        <div className="card card-border flex-row items-center gap-3 bg-base-100 p-4 opacity-60">{content}</div>
      ) : (
        <Link
          to="/lesson/$lessonId"
          params={{ lessonId }}
          className="card card-border flex-row items-center gap-3 bg-base-100 p-4 hover:bg-base-200"
        >
          {content}
        </Link>
      )}
    </li>
  );
}
