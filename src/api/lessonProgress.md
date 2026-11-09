# api/lessonProgress, api/weakSigns

Migration `20261105162600_lesson_progress_weak_signs.sql`.

**lesson_progress** has one row per (user, lesson) while the lesson is unfinished [S.6]. It stores
`step_index, item_index, seed, answers`. The lesson mode (camera / watch) the position refers to is stored inside
`answers` as `m`, so no schema change was needed.
- `saveLessonProgress` upserts on `(user_id, lesson_id)`. user_id comes from `auth.uid()`, and the column grants
  don't allow sending it. The upsert's DO UPDATE sets every column it sends, which is why `lesson_id` is in the
  UPDATE grant.
- `clearLessonProgress` runs on completion and on Redo.
- The query has `staleTime: Infinity, gcTime: 0`: it's read once when the lesson opens, and after that the session
  owns the position.

**weak_signs** has one row per (user, item_key) [S.23].
- `recordWeakMiss(item)` calls the `record_weak_miss` RPC (SECURITY INVOKER). It inserts the row or does
  `misses + 1, correct_streak = 0`, atomically.
- `fetchWeakSigns(userId)` is for Practice later. Practice also owns the "remove after 3 correct" path [P.10]. The
  grants already allow UPDATE of `correct_streak` and DELETE.
