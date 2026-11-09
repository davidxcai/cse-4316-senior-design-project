import type { UnitProgress } from "../../domain/progress";

const AHEAD = 2;

/** Default view: the current unit plus up to 2 ahead. Falls back to unit 1 (first row). */
export function visibleUnits(units: UnitProgress[], currentUnitId: number | null, showAll: boolean): UnitProgress[] {
  if (showAll) return units;
  const found = units.findIndex((u) => u.unit.id === currentUnitId);
  const start = found === -1 ? 0 : found;
  return units.slice(start, start + 1 + AHEAD);
}
