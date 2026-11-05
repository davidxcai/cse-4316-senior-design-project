import { createFileRoute } from "@tanstack/react-router";
import SignInPage from "../../features/auth/SignInPage";

export const Route = createFileRoute("/_public/sign-in")({
  component: SignInPage,
});
