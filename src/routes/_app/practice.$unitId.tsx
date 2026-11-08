import { createFileRoute } from "@tanstack/react-router";
import PracticeSessionPage from "../../features/practice/PracticeSessionPage";

export const Route = createFileRoute("/_app/practice/$unitId")({
  staticData: { focus: true },
  component: PracticeRoute,
});

function PracticeRoute() {
  const { unitId } = Route.useParams();
  // key: a new unit starts a new session
  return <PracticeSessionPage key={unitId} unitId={Number(unitId)} />;
}
