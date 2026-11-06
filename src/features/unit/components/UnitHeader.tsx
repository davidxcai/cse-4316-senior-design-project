import ProgressBar from "../../../components/ProgressBar";
import type { UnitProgress } from "../../../domain/progress";
import UnitTile from "../../../components/unit/UnitTile";
import { unitStyle } from "../../../components/unit/unitStyle";

/** Number tile, "UNIT n", title, and lessons done / total [L.2–3]. */
export default function UnitHeader({ progress }: { progress: UnitProgress }) {
  const { unit, done, total } = progress;
  return (
    <header className="flex items-center gap-4">
      <UnitTile unitId={unit.id} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-xs font-semibold tracking-wide text-base-content/60">UNIT {unit.id}</span>
        <h1 className="text-2xl font-bold">{unit.title}</h1>
        <ProgressBar value={done} max={total} color={unitStyle(unit.id).bar} showCount />
      </div>
    </header>
  );
}
