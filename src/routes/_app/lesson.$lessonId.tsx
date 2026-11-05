import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/lesson/$lessonId")({
  staticData: { focus: true },
  component: () => <h1 className="text-2xl font-bold">Lesson</h1>,
});
