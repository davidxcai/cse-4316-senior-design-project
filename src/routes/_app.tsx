import { createFileRoute, redirect } from "@tanstack/react-router";
import AppShell from "../components/shell/AppShell";

export const Route = createFileRoute("/_app")({
  beforeLoad: ({ context }) => {
    if (context.auth.status !== "signed-in") throw redirect({ to: "/sign-in" });
  },
  component: AppShell,
});
