# useTryItDemo

Drives the landing "try it" demo (LP.4–LP.9). Wraps `useRecognizer`; the UI never touches the recognizer directly.

- `attempt({ expect: HELLO })` runs without `allowed`, so the verdict is `correct` or `rejected` (rejected = try again, shown with a neutral icon, not an error).
- Camera refs, status/error and `startCamera()` come from the shared `useSignCamera` (returned as `camera`, handed to `CameraView`). `startCamera()` is the only thing that starts the camera and downloads models (LP.6). Signed out means no saved dominant hand, so it is right (LP.9).
- Once `status === "ready"` and HELLO is recognizable, it runs one `attempt()` at a time. A verdict ends the pass; `retry()` clears it and the effect starts the next attempt.
- `isRecognizable(HELLO)` is read at render time. While false (model has no HELLO yet) the camera still works but no attempt runs and `verdict` stays `null`. When the model ships this starts working with no code change.
- `useSignCamera` stops the camera on unmount. AbortErrors from cancelled attempts are ignored; anything else is rethrown.
- Camera errors are not caught here beyond swallowing the rejected `start()`; they appear as `error` from the recognizer.
