import { createFileRoute } from "@tanstack/react-router";
import LessonPage from "../../features/lesson/LessonPage";

export const Route = createFileRoute("/_app/lesson/$lessonId")({
  staticData: { focus: true },
  component: LessonRoute,
});

function LessonRoute() {
  const { lessonId } = Route.useParams();
  return <LessonPage lessonId={lessonId} />;
}
