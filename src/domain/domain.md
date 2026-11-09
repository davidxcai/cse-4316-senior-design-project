# Domain: curriculum, progress, streak

Pure TypeScript with no React, network or storage. Home and the Learn page get everything they show about
progress from these three modules, applied to the `lesson_completions` rows.

## curriculum.ts

`UNITS` is transcribed from curriculum.md "## Unit lesson plans" (vocabulary track only; M2 sentence work isn't
modeled). Each unit's rows are its lessons, then a **Unit Quiz** (`N.quiz`, every unit, L.6), then a review
checkpoint where the curriculum puts one (L.7): `2.review` (Review A, units 1–2), `4.review` (Review B, 3–4),
`5.final` (Final Review, 1–5). Quiz and review items are the deduplicated union of the covered lessons' items.
They mix letters and digits, so the lesson page must split them before building an `allowed` list (see
src/recognition/README.md).

Ids are the persisted key in `lesson_completions.lesson_id`. **Never rename an id** once users have completions
against it. Add new rows with new ids instead. The DB only checks the id format, so adding lessons needs no migration.

`minutes` = `MINUTES_PER_LESSON` (5) × row count. That's a guess, to be tuned once real sessions are timed.

Mapping choices:
- Ranges are expanded: `1–15`, `16–29`, `30–66`, `67–100` become number items, and `MONDAY–SUNDAY` becomes the
  seven day signs.
- 1.2 orders the letters with the "fist" letters A S T M N E first, as curriculum.md says.
- 2.1 "SIGN (ASL)" becomes two signs, `SIGN` and `ASL`. The recognition README tracks ASL as its own sign
  (it isn't in any dataset).
- 2.4 "double letters" is a skill, not an item, so it adds nothing beyond D G H K P Q R U V.
- 4.3 pairs that are one sign in ASL use one gloss: I/ME → `ME`, HE/SHE → `HE`, HIS/HER → `HIS`. These match the
  ASL Citizen labels the recognizer would alias.
- 3.4, 4.4 and 5.4 add the letters they list (Z P Q Y, J, G H) after their other items.
- 6.1 items are empty (TODO: pick the unit story). 6.2 is M2 grammar and carries only its culture note in M1.
  Unit 6 still gets a quiz row so every unit has the same shape. Its quiz is empty for now.
- Glosses keep curriculum.md spelling (`THANK-YOU`, `DON'T-LIKE`, `NOT-YET`, `DORM`, `BIKE`). Recognition
  normalizes and aliases them. Nothing here filters by `isRecognizable`. That's the lesson page's job.
- Titles are shortened for row display ("Shapes & Colors" instead of "Shapes, colors, same/different").

## progress.ts

`unitProgress(completedIds)` gives one entry per unit, in order:
- A unit is **completed** when every row (lessons + quiz + review) has at least one completion. Otherwise it is
  **in-progress** if some rows are done, or **not-started** if none are.
- **Locked** [5.11]: unit 1 is always open, and unit N opens when unit N-1 is completed. A unit that already has
  completions is also treated as open. That way, adding a row to an earlier unit later can't re-lock work the user
  has done. Unit 6 (optional) unlocks after 5 and blocks nothing, because it's last.
- `percent` is rounded down, so 100 means done.
- `currentLessonId` is the first row not yet done in an open, unfinished unit. That row is also the in-unit
  unlocking point for L.5: rows before it are done, rows after it are locked.

`lessonRowStatuses(unitProgress, completed)` gives the per-row status inside a unit (done / current / available /
locked) for the Unit page and the lesson lock check. See hooks/useLessonSession.md.

`resumeTarget` returns the first open, unfinished unit, or null when every unit is complete.

## streak.ts

A **local** calendar day counts if it has ≥1 completion [7.4]. Day keys are `YYYY-MM-DD` in the browser's time
zone, built from y/m/d, so DST shifts can't skip or repeat a day.
- `current` is the run ending today, or ending yesterday if nothing is done today yet. That way the streak
  doesn't show 0 all morning.
- `best` is the longest run of consecutive days ever (always ≥ current).
- `week` is Monday–Sunday of the current week, with `isToday`/`isFuture` for the strip.

Times come from the server's `completed_at` (the client can't set it), so a streak can't be backdated. A user who
changes time zone may see a day boundary move. That's accepted.

## Lesson modules

`lessonPlan.ts` and `lessonSession.ts` (see lessonPlan.md), plus `signContent.ts`, `cultureNotes.ts` and
`signClips.ts` (see signContent.md). `Lesson.culture` comes from cultureNotes.ts. `findUnit` and `ALL_ITEMS` (the
course-wide Recognize distractor pool) are in curriculum.ts.
