import { createContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  signInWithPassword,
  signOutLocal,
  signUpWithPassword,
  subscribeToSession,
  type SignUpInput,
} from "../api/auth";
import { profileKeys, profileQueryOptions, type DominantHand } from "../api/profiles";

export type { SignUpInput };

export type AuthUser = { id: string; email: string; name: string; dominantHand: DominantHand };

export type AuthState = {
  user: AuthUser | null;
  status: "loading" | "signed-in" | "signed-out";
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: SignUpInput) => Promise<void>;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthState | null>(null);

/** The parts of the session we use. Kept stable across TOKEN_REFRESHED so nothing re-renders. */
type SessionUser = { id: string; email: string };

type Resolved = { status: "signed-in" | "signed-out"; user: AuthUser | null };

const emailPrefix = (email: string) => email.split("@")[0] || "Signer";

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  // undefined = INITIAL_SESSION not received yet; null = signed out.
  const [sessionUser, setSessionUser] = useState<SessionUser | null | undefined>(undefined);

  useEffect(
    () =>
      // Sync callback, no Supabase calls inside: the profile fetch is driven by useQuery below.
      subscribeToSession((session) => {
        const next = session ? { id: session.user.id, email: session.user.email ?? "" } : null;
        setSessionUser((prev) =>
          prev && next && prev.id === next.id && prev.email === next.email ? prev : next,
        );
      }),
    [],
  );

  const userId = sessionUser?.id;
  const profile = useQuery({
    ...profileQueryOptions(userId ?? ""),
    enabled: !!userId,
  });

  useEffect(() => {
    if (profile.error) {
      console.warn("[auth] profile fetch failed, using fallback name/hand", profile.error);
    } else if (profile.isSuccess && profile.data === null) {
      console.warn("[auth] no profile row for user, using fallback name/hand");
    }
  }, [profile.error, profile.isSuccess, profile.data]);

  // What the session + profile say right now, or null while either is still pending.
  const current = useMemo<Resolved | null>(() => {
    if (sessionUser === undefined) return null;
    if (sessionUser === null) return { status: "signed-out", user: null };
    if (profile.isPending) return null;
    const p = profile.data;
    return {
      status: "signed-in",
      user: {
        id: sessionUser.id,
        email: sessionUser.email,
        name: p?.name ?? emailPrefix(sessionUser.email),
        dominantHand: p?.dominantHand ?? "right",
      },
    };
  }, [sessionUser, profile.isPending, profile.data]);

  // After the first resolution, a pending profile (e.g. right after sign-in) keeps the previous
  // state instead of dropping back to 'loading', which would unmount the router.
  const [settled, setSettled] = useState<Resolved | null>(null);
  useEffect(() => {
    if (current) setSettled(current);
  }, [current]);

  const value = useMemo<AuthState>(() => {
    const shown = current ?? settled;
    return {
      user: shown?.user ?? null,
      status: shown?.status ?? "loading",
      signIn: signInWithPassword,
      signUp: signUpWithPassword,
      signOut: async () => {
        await signOutLocal();
        queryClient.removeQueries({ queryKey: profileKeys.all });
      },
    };
  }, [current, settled, queryClient]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
