import { createFileRoute } from "@tanstack/react-router";
import PracticePage from "../../features/practice/PracticePage";

export const Route = createFileRoute("/_app/practice/")({
  component: PracticePage,
});
