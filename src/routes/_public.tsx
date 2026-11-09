import { createFileRoute, redirect } from "@tanstack/react-router";
import PublicShell from "../components/shell/PublicShell";

export const Route = createFileRoute("/_public")({
  beforeLoad: ({ context }) => {
    if (context.auth.status === "signed-in") throw redirect({ to: "/home" });
  },
  component: PublicShell,
});
