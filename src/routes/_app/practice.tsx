import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/practice")({
  component: () => <h1 className="text-2xl font-bold">Practice</h1>,
});
