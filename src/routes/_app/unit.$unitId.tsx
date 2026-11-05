import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/unit/$unitId")({
  component: () => <h1 className="text-2xl font-bold">Unit</h1>,
});
