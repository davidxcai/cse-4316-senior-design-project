import { IconArrowRight, IconHandStop, IconLock } from "@tabler/icons-react";
import { Link } from "@tanstack/react-router";
import UnitTile from "../../../components/unit/UnitTile";
import type { PracticeUnit } from "../hooks/usePracticeUnits";

/** One unit to practice. Units with no completed lesson yet are shown locked. */
export default function PracticeUnitRow({ unit, signs }: PracticeUnit) {
  const locked = signs === 0;
  return (
    <div className={`card card-border bg-base-100 ${locked ? "opacity-60" : ""}`}>
      <div className="card-body flex-row items-center gap-4 p-4">
        <UnitTile unitId={unit.id} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h3 className="truncate font-semibold">{unit.title}</h3>
          {!locked && (
            <span className="flex items-center gap-1 text-sm text-base-content/70" aria-label={`${signs} signs`}>
              <IconHandStop size={16} aria-hidden />
              {signs}
            </span>
          )}
        </div>
        {locked ? (
          <IconLock size={22} className="shrink-0 text-base-content/50" aria-label="Locked" />
        ) : (
          <Link
            to="/practice/$unitId"
            params={{ unitId: String(unit.id) }}
            className="btn btn-primary btn-square shrink-0"
            aria-label={`Practice unit ${unit.id}`}
          >
            <IconArrowRight size={20} />
          </Link>
        )}
      </div>
    </div>
  );
}
