import { useState } from "react";
import { useUnitOverview } from "../../../hooks/useUnitOverview";
import { visibleUnits } from "../visibleUnits";
import { useResumeTarget } from "../hooks/useResumeTarget";
import HomeError from "./HomeError";
import UnitRow from "./UnitRow";
import ViewAllToggle from "./ViewAllToggle";

export default function UnitList() {
  const { data, isPending, error } = useUnitOverview();
  const target = useResumeTarget();
  const [showAll, setShowAll] = useState(false);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Units</h2>
        <ViewAllToggle expanded={showAll} onToggle={() => setShowAll((v) => !v)} />
      </div>
      {error ? (
        <HomeError />
      ) : isPending || !data ? (
        <>
          <div className="skeleton h-32 w-full" />
          <div className="skeleton h-32 w-full" />
          <div className="skeleton h-32 w-full" />
        </>
      ) : (
        visibleUnits(data, target?.unitId ?? null, showAll).map((p) => (
          <UnitRow key={p.unit.id} progress={p} showOptional={showAll} />
        ))
      )}
    </section>
  );
}
