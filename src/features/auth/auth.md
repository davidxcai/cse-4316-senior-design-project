# features/auth

Sign in, two-step sign up, sign out (wireframes §7, A.1/A.3/A.5/A.6).

- `SignInPage`, `SignUpPage`: page components; route files stay thin. `SignUpPage` owns all form state across both steps, so Back keeps input, and calls `signUp()` once, at the end of step 2.
- `AccountStep` (email + password, "Next") and `ProfileStep` (name + dominant hand join, "Start") are independent; the page composes them.
- `CredentialFields`: email/password inputs shared by sign-in and step 1 (only autocomplete and `minLength` differ). `MIN_PASSWORD_LENGTH = 6` matches Supabase.
- `AuthCard` (logo + optional "1/2" indicator) and `AuthError` (icon + message alert) are shared chrome.
- `SignOutButton`: used on the Profile placeholder.
- Native `<form onSubmit>` so Enter works. Pending disables the submit and shows a daisyUI spinner (`useAsyncAction`).
- No navigation after success: the route guards redirect on auth status change; a `navigate()` here would race them.
- Dominant hand uses daisyUI `join` of radio `btn`s; the radio input can't contain an icon, so the options are text only.
