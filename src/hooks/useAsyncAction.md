# useAsyncAction

Pending + error state for a single async action. Used by the sign-in and sign-up forms.

- `run(action)` clears the previous error, sets `pending`, and stores `error.message` if the action rejects. `useAuth` promises reject with short user-facing messages, so they are displayed unchanged.
- It never navigates. Route guards redirect when auth status changes.
