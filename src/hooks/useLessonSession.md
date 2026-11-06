# useUnit, useLessonSession, useProgressWriter, useCameraAvailable

- `useCameraAvailable()`: `enumerateDevices` has a `videoinput` (never prompts; null while checking). No
  `mediaDevices` = false; an enumeration error = true, since camera is the preferred layout.
- `useUnit(unitId)` gives the unit progress plus row statuses from `lessonRowStatuses` (domain/progress.ts).
  A row unlocks when the previous row is done. `current` = the first unlocked row not yet done. `available` = any
  other unlocked row not yet done (only happens when rows are added later). A locked unit locks every row.
  `notFound` is static (no such unit id).
- `useLessonSession(lessonId)` loads completions, the saved resume point and `useCameraAvailable()`, builds the plan
  from the saved seed (or a new one) in camera mode if the device has a camera and watch mode if not, then runs the
  pure machine in domain/lessonSession.ts.
  - The mode is fixed when the session starts. A resume point saved in the other mode is remapped
    (`remapSession`), so a learner who gets a camera later resumes in camera mode. `switchToWatch()` (Watch on a
    camera error) remaps the live session. Redo keeps the session's mode.
  - Every move and answer is upserted, debounced 400 ms (`useProgressWriter`). The writes are serialized, so a late
    save can't land after the completion's delete. A pending save is flushed on unmount.
  - `next()` on the last item calls `completeLesson`, then clears the progress row, computes the post-completion
    streak from the cached completions + the new row, sets `completed`, and invalidates `completions` (Home, the
    Unit page and the streak update).
    `completing` / `completeError` are extra fields: on failure `canNext` turns true again, so `next()` retries.
  - A Sign task's first miss (`wrong` or `rejected`) or its hint calls `recordWeakMiss` once in the background and
    invalidates `weakSigns`. Learn misses aren't recorded.
  - status: `not-found` (no lesson), `error` (a query failed), `loading`, `locked` (by useUnit's rules), `ready`.
