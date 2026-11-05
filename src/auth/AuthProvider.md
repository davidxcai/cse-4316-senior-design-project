# AuthProvider

Holds the signed-in user (Supabase session + `public.profiles` row) and exposes `AuthState` through `useAuth()` (`src/hooks/useAuth.ts`).

```ts
type AuthUser   = { id: string; email: string; name: string; dominantHand: 'left' | 'right' }
type SignUpInput = { email: string; password: string; name: string; dominantHand: 'left' | 'right' }
type AuthState  = {
  user: AuthUser | null
  status: 'loading' | 'signed-in' | 'signed-out'
  signIn(email, password): Promise<void>
  signUp(input: SignUpInput): Promise<void>
  signOut(): Promise<void>
}
```

## Files

- `src/api/supabase.ts`: the one browser client. Throws at import if `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` are missing.
- `src/api/auth.ts`: `signInWithPassword`, `signUpWithPassword`, `signOutLocal`, `subscribeToSession`, and the error-code → message mapping.
- `src/api/profiles.ts`: `fetchProfile`, `updateProfile`, `profileQueryOptions(userId)` (key `['profile', userId]`), `profileKeys`.
- `supabase/migrations/*_profiles.sql`: the table, RLS, grants and the signup trigger.

## How it works

- **Session**: `onAuthStateChange` only. It fires `INITIAL_SESSION` on subscribe (after the client finishes initializing), so there's no separate `getSession()` call and no race between the two. The callback is synchronous and only calls `setState`. It must not call or await other Supabase methods: the auth-js docs mark async callbacks deprecated because a nested refresh from `TOKEN_REFRESHED` can deadlock. Work that needs Supabase (the profile fetch) is driven by React state instead.
- Only `{ id, email }` is kept from the session, and the previous object is reused when they're unchanged, so hourly `TOKEN_REFRESHED` events don't re-render consumers.
- **Profile**: `useQuery(profileQueryOptions(userId))`, enabled once there's a user. The profile page should call `queryClient.invalidateQueries({ queryKey: profileKeys.detail(id) })` after `updateProfile`, and `user` updates with it. If the fetch fails, or the row is missing, `name` falls back to the email prefix and `dominantHand` to `'right'`, with a `console.warn`. `retry: 1` keeps a failing fetch from holding `loading` through the default 3 retries.
- **status**: `'loading'` only until the first resolution (initial session, plus profile if signed in). After that, a pending profile (right after `signIn`/`signUp`) keeps the previous status (`'signed-out'`) until the profile arrives, then flips to `'signed-in'`. Going back to `'loading'` would make `main.tsx` unmount the router mid-flow.
- **Errors**: `signIn`/`signUp` reject with short messages mapped from `AuthError.code` (`invalid_credentials` → "Wrong email or password", `user_already_exists`/`email_exists` → "Email already in use", `weak_password`, rate limits, network). Unmapped codes give "Something went wrong. Try again" and a `console.warn` with the raw error. Raw Supabase messages never reach the UI.
- **signUp** sends `name` and `dominant_hand` in `options.data` (`raw_user_meta_data`). The `on_auth_user_created` trigger copies them into `public.profiles` and coerces bad values. Email confirmation is off, so `signUp` returns a session. If it's ever turned on, `signUp` rejects with "Check your email to finish signing up".
- **signOut** uses `scope: 'local'` (this browser only; the library default `'global'` signs out every device) and removes cached profile queries.

## How it connects to routing

- `main.tsx` passes `auth` into the router context, and doesn't render the router while `status === 'loading'`, so guards never decide on an unresolved session.
- When `status` changes, `main.tsx` calls `router.invalidate()`. That re-runs `beforeLoad`, and the guards do the navigation: `_public` sends signed-in users to `/home`, `_app` sends signed-out users to `/sign-in`. Pages don't navigate after `signIn()`/`signOut()` themselves. A `navigate()` in the same handler would run the guard against the old context, and `signIn()` resolves before the profile (and so `status`) has updated.

## History

- Replaced the sessionStorage dev stub (`signify.devSignedIn`) with Supabase auth.
