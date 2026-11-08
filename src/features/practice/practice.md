# features/practice

Simple unit practice (a cut-down wireframes §4). `/practice` lists the units; `/practice/$unitId` runs an endless session over that unit's words. The full Pick/Weak setup, multi-lesson picker and mastery drop-out (P.1–P.4, P.10) aren't built yet.

- Words = items of the unit's **completed** regular lessons (`domain/practice.ts` `practiceItems`), so a unit with no completed lesson shows locked. Quizzes/reviews add no new words.
- A round is Recognize over every word with a clip, then Sign over every recognizable word (camera mode only), each block shuffled; a new round is dealt when one ends. Blocks instead of interleaving because `SignStep` owns the camera: it stays mounted for a whole Sign block, so Start camera is needed once per round rather than once per card.
- Words with no clip skip Recognize; words with no recognizer skip Sign (same rule as S.30). A unit where nothing qualifies shows the Empty notice.
- Recognize waits for an answer. Sign cards can always be skipped with Next. Practice must never block.
- Positive reinforcement: only a ✓ tally (first-try Recognize answers + signs done without Hint), no ✗ count and no missed list. That's a deliberate departure from P.8/P.9 as written.
- Nothing is persisted, and weak_signs isn't touched. Leaving the page ends the session. Stop shows `PracticeSummary` (shared `SessionSummary`): signs practiced, correct, Again, Done.
- Camera vs watch layout comes from `useCameraAvailable` once at start. A camera error's Watch button calls `switchToWatch`, which drops the round's Sign cards (`toWatch`).
- The route uses `staticData: { focus: true }` and keys the page by unitId.
- `PracticeFrame` repeats LessonFrame's focus-Next-on-unlock effect (a few lines) rather than sharing it. Extract it if a third frame appears.
