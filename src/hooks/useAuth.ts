import { useContext } from "react";
import { AuthContext, type AuthState } from "../auth/AuthProvider";

export function useAuth(): AuthState {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("useAuth() needs an <AuthProvider> above it");
  return auth;
}
