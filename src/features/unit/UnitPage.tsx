import { IconAlertTriangle, IconError404 } from "@tabler/icons-react";
import Notice from "../../components/Notice";
import { useUnit } from "../../hooks/useUnit";
import LessonList from "./components/LessonList";
import UnitHeader from "./components/UnitHeader";

export default function UnitPage({ unitId }: { unitId: number }) {
  const { data, isPending, error, notFound } = useUnit(unitId);

  if (notFound) return <Notice icon={IconError404} text="Not found" />;
  if (error) return <Notice icon={IconAlertTriangle} text="Couldn't load" />;
  if (isPending || !data)
    return (
      <div className="flex flex-col gap-4">
        <div className="skeleton h-16 w-full" />
        <div className="skeleton h-16 w-full" />
        <div className="skeleton h-16 w-full" />
        <div className="skeleton h-16 w-full" />
      </div>
    );

  return (
    <div className="flex flex-col gap-6">
      <UnitHeader progress={data.progress} />
      <LessonList rows={data.rows} />
    </div>
  );
}
