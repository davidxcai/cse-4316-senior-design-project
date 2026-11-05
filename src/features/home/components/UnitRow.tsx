import { IconArrowRight, IconBook, IconCheck, IconClock, IconLock } from "@tabler/icons-react";
import { Link } from "@tanstack/react-router";
import type { UnitProgress, UnitStatus } from "../../../domain/progress";
import { unitStyle } from "../unitStyle";
import UnitTile from "./UnitTile";

function StatusBadge({ status }: { status: UnitStatus }) {
  if (status === "in-progress") return <span className="badge badge-primary badge-soft">In progress</span>;
  if (status === "completed")
    return (
      <span className="badge badge-success badge-soft gap-1">
        <IconCheck size={14} />
        Completed
      </span>
    );
  if (status === "locked")
    return (
      <span className="badge badge-ghost gap-1">
        <IconLock size={14} />
        Locked
      </span>
    );
  return null;
}

type Props = { progress: UnitProgress; showOptional: boolean };

export default function UnitRow({ progress, showOptional }: Props) {
  const { unit, status, percent } = progress;
  const locked = status === "locked";
  const lessonCount = unit.lessons.filter((l) => l.kind === "lesson").length;

  return (
    <div className={`card card-border bg-base-100 ${locked ? "opacity-60" : ""}`}>
      <div className="card-body flex-row items-center gap-4 p-4">
        <UnitTile unitId={unit.id} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold tracking-wide text-base-content/60">UNIT {unit.id}</span>
            <StatusBadge status={status} />
            {showOptional && unit.optional && <span className="badge badge-outline">optional</span>}
          </div>
          <h3 className="font-semibold">{unit.title}</h3>
          <p className="truncate text-sm text-base-content/70">{unit.description}</p>
          <div className="flex items-center gap-4 text-sm text-base-content/70">
            <span className="flex items-center gap-1">
              <IconBook size={16} aria-hidden />
              {lessonCount}
            </span>
            <span className="flex items-center gap-1">
              <IconClock size={16} aria-hidden />
              {unit.minutes}m
            </span>
          </div>
          {!locked && (
            <progress className={`progress ${unitStyle(unit.id).bar} w-full`} value={percent} max={100} />
          )}
        </div>
        {locked ? (
          <IconLock size={22} className="shrink-0 text-base-content/50" aria-label="Locked" />
        ) : (
          <Link
            to="/unit/$unitId"
            params={{ unitId: String(unit.id) }}
            className="btn btn-primary btn-square shrink-0"
            aria-label={`Open unit ${unit.id}`}
          >
            <IconArrowRight size={20} />
          </Link>
        )}
      </div>
    </div>
  );
}
