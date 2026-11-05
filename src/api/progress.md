# api/progress

Reads and writes `public.lesson_completions` (migration `20261105160646_lesson_completions.sql`).

- `fetchCompletions(userId)` returns every row for the user, oldest first, as `{ lessonId, completedAt: Date }`.
  It pages in chunks of 1000, because PostgREST silently caps a response at max-rows. Redoing a lesson adds a row,
  so the count grows over time.
- `completeLesson(lessonId)` is for the lesson page. It rejects ids `findLesson` doesn't know, then inserts
  `lesson_id` only. The database fills `user_id` (`auth.uid()`) and `completed_at` (`now()`). The column grant
  allows nothing else, so completion times can't be forged. After it succeeds, invalidate `completionKeys.all`.
- `completionKeys.list(userId)` = `['completions', userId]`. `completionsQueryOptions` sets a 5 min staleTime,
  because only the user's own inserts change this data.

Progress and streaks are derived client-side (src/domain/) rather than in SQL views. The data is small, and the
rules (unlocking, local-day streaks) depend on the curriculum and the browser's time zone, which the DB doesn't know.
