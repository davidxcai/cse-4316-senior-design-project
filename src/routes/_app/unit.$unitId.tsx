import { createFileRoute } from "@tanstack/react-router";
import UnitPage from "../../features/unit/UnitPage";

export const Route = createFileRoute("/_app/unit/$unitId")({
  component: UnitRoute,
});

function UnitRoute() {
  const { unitId } = Route.useParams();
  return <UnitPage unitId={Number(unitId)} />;
}
