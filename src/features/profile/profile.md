# features/profile

Profile page at `/profile` (R.1, R.2, R.4, R.5, R.7). R.3 stats row is skipped (no progress data yet); a TODO marks its spot.

- **Saving is not optimistic.** `useUpdateProfile` calls `updateProfile` and, on success, awaits `invalidateQueries(profileKeys.detail(id))`, so `isPending` lasts until `useAuth().user` has the new value. The control shows a pending state (disabled, spinner on the save button; the hand select shows the chosen value) instead of guessing. On error: a "Couldn't save" alert, and the old value shows again (the name editor closes).
- ProfileHeader and HandSelect each call `useUpdateProfile`, so each owns its own pending/error state.
- CameraSelect is local to the browser (`useCameraPreference`, localStorage) and never prompts for camera access. Options without a deviceId (pre-permission) are disabled.
- **Reset progress** (Settings): a daisyUI `dialog` modal confirms, then `useResetProgress` calls the `public.reset_progress()` RPC, which deletes the user's completions, lesson resume points and weak signs in one transaction (SECURITY DEFINER, since `lesson_completions` has no client DELETE). On success it drops cached `lessonProgress` queries and awaits refetch of completions and weak signs before closing; on error the modal stays open with "Couldn't reset". Profile data (name, hand) and the camera choice are kept.
- `initials()` is shared with the sidebar `UserCard` via `src/domain/initials.ts`.
