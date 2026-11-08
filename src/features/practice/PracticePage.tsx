import { IconAlertTriangle } from "@tabler/icons-react";
import Notice from "../../components/Notice";
import PracticeUnitRow from "./components/PracticeUnitRow";
import { usePracticeUnits } from "./hooks/usePracticeUnits";

/** Practice setup: pick a unit [4a, simplified to one unit at a time]. */
export default function PracticePage() {
  const { data, isPending, error } = usePracticeUnits();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Practice</h1>
      {error ? (
        <Notice icon={IconAlertTriangle} text="Couldn't load" />
      ) : isPending || !data ? (
        <div className="flex flex-col gap-4">
          <div className="skeleton h-24 w-full" />
          <div className="skeleton h-24 w-full" />
          <div className="skeleton h-24 w-full" />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {data.map((p) => (
            <PracticeUnitRow key={p.unit.id} {...p} />
          ))}
        </div>
      )}
    </div>
  );
}
