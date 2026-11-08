# features/lesson

Lesson page at `/lesson/$lessonId` (wireframes §3, S.1–S.30). The route keeps `staticData: { focus: true }`, which collapses the sidebar. `useLessonSession` (hooks/, owned elsewhere) holds the step machine, answers, gating and completion; this feature only renders it.

- `LessonPage` switches on `session.status` (loading skeleton, locked → redirect to the unit, not-found, error), then handles an empty plan, `completed`, and the normal frame.
- `LessonFrame` is the chrome only: exit, label + title, `StepIndicator` over the plan's real steps, `ProgressBar` n/m, ← →. The step content is passed as children. The ← → footer is `sticky bottom-0` so it stays on screen when a step is taller than the viewport. The ← / → keys mirror the buttons (`useHotkeys`), and → takes focus when it goes from disabled to enabled (a Recognize answer, Learn reps done, a correct Sign), so Enter continues.
- `StepContent` maps the current step to one of `LearnStep`, `WatchStep`, `RecognizeStep`, `SignStep`, `CultureStep`. They are independent and never reference each other. `RecognizeStep`, `SignStep`, `LessonCamera` (components/signing/) and `useSignAttempts` (src/hooks/) moved out of this feature on 2026-11-06 so Practice can reuse them.
- Watch / Recognize / Culture are keyed per item so they reset. `LearnStep` and `SignStep` are not keyed: they own the camera, which must keep running between signs of the same step and stop when the step is left.
- `useSignAttempts` (src/hooks/) loops `attempt({ expect, allowed })` while the camera is ready: attempt, show the verdict for 1.2 s, attempt again. There is no Retry; the learner just signs again. Learn keeps looping after the 3 reps so the learner can keep repeating; Sign stops at the first correct sign. The task and callback are held in refs so a new object never restarts an attempt.
- `LearnStep`: clip and camera side by side, `SignCaption`, one dot per correct sign (`LEARN_REPS`). A watch-only card (no recognizer) hides the camera with `hidden` instead of unmounting it, so the stream survives going back to a camera card.
- `SignStep`: camera, the word, and Hint. Hint (or a correct sign) shows the clip next to the camera.
- `LessonCamera` wraps `CameraView` for lessons. Positive reinforcement: a `wrong` verdict shows the neutral try-again icon, never ✗, and the predicted sign isn't shown. On a camera error it adds Watch, which calls `switchToWatch` and continues the lesson in the watch layout.
- Camera vs watch layout is decided by `useLessonSession` (`useCameraAvailable`) when the lesson starts.
- Handshape notes render only when `flags.showHandshapeNotes` (src/config/flags.ts) and the sign has one.
- Culture shows a ghost "draft" badge while `note.draft`; this is the one approved badge.
- `LessonComplete` uses the shared `SessionSummary`. Next lesson links to the next row in the unit; for the last row it becomes an icon button back to the unit.
