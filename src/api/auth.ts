import { isAuthError, isAuthRetryableFetchError, type Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import type { DominantHand } from "./profiles";

export type SignUpInput = {
  email: string;
  password: string;
  name: string;
  dominantHand: DominantHand;
};

const GENERIC = "Something went wrong. Try again";

const SIGN_IN_MESSAGES: Record<string, string> = {
  invalid_credentials: "Wrong email or password",
  email_not_confirmed: "Confirm your email first",
  user_banned: "This account is disabled",
  over_request_rate_limit: "Too many attempts. Try again later",
  request_timeout: "Server timed out. Try again",
};

const SIGN_UP_MESSAGES: Record<string, string> = {
  user_already_exists: "Email already in use",
  email_exists: "Email already in use",
  weak_password: "Password is too weak",
  email_address_invalid: "Enter a valid email",
  validation_failed: "Enter a valid email and password",
  signup_disabled: "Sign-ups are closed",
  email_provider_disabled: "Sign-ups are closed",
  over_request_rate_limit: "Too many attempts. Try again later",
  over_email_send_rate_limit: "Too many attempts. Try again later",
  request_timeout: "Server timed out. Try again",
};

/** Maps a Supabase auth error to a short, user-facing Error. Raw messages never pass through. */
function toUserError(error: unknown, messages: Record<string, string>): Error {
  if (isAuthRetryableFetchError(error)) return new Error("Can't reach the server");
  if (isAuthError(error) && error.code && messages[error.code]) {
    return new Error(messages[error.code]);
  }
  console.warn("[auth] unmapped error", error);
  return new Error(GENERIC);
}

export async function signInWithPassword(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw toUserError(error, SIGN_IN_MESSAGES);
}

export async function signUpWithPassword(input: SignUpInput): Promise<void> {
  const { data, error } = await supabase.auth.signUp({
    email: input.email.trim(),
    password: input.password,
    // Seeds public.profiles via the on_auth_user_created trigger. Never used for authorization.
    options: { data: { name: input.name.trim(), dominant_hand: input.dominantHand } },
  });
  if (error) throw toUserError(error, SIGN_UP_MESSAGES);
  if (!data.session) {
    // Only reachable if email confirmation is on. An existing email then comes back
    // as an obfuscated user with no identities instead of an error.
    if (data.user && data.user.identities?.length === 0) throw new Error("Email already in use");
    throw new Error("Check your email to finish signing up");
  }
}

/** Local scope: signs out this browser only, not the user's other devices. */
export async function signOutLocal(): Promise<void> {
  const { error } = await supabase.auth.signOut({ scope: "local" });
  if (error) {
    console.warn("[auth] signOut failed", error);
    throw new Error(GENERIC);
  }
}

/**
 * Subscribes to session changes. Fires INITIAL_SESSION first, so no separate getSession() is needed.
 * The callback is synchronous and must not call other Supabase methods (see AuthProvider.md).
 */
export function subscribeToSession(onChange: (session: Session | null) => void): () => void {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => onChange(session));
  return () => data.subscription.unsubscribe();
}
