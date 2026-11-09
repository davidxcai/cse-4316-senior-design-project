# lessonPlan, lessonSession

## lessonPlan.ts
`buildLessonPlan(lesson, rng, mode)` returns the lesson's steps. `mode` is `"camera"` (the default and preferred
layout) or `"watch"` (no camera on the device, or the learner chose Watch after a camera error).
- kind `lesson`: camera **Learn → Recognize → Sign → Culture**; watch **Watch → Recognize → Culture**.
  kind `quiz` / `review`: camera Recognize → Sign; watch Recognize only.
- **Learn** (active learning): one card per item in curriculum order, with the clip next to the camera. The learner
  signs along until `LEARN_REPS` (3) correct signs, which don't have to be in a row. Tries are unlimited and misses
  aren't recorded. An item with no recognizer (`allowed: null`, e.g. numbers 10–15) is a watch-only card.
- **Watch** lists the items in curriculum order, clips only (the old Learn).
- **Recognize** has one question per item, in shuffled order. There are 4 choices of the same kind as the item.
  Distractors come from the lesson first, then from the rest of the course (`ALL_ITEMS`), so small lessons still get 4.
- **Sign** (recall) has only `isRecognizable` items [S.30], and the step is dropped when there are none. The word is
  shown, the clip is behind Hint. One correct sign unlocks Next. `allowed` = the lesson's recognizable items of the
  *same kind*, so letters and digits never share a list (V/2, W/6, O/0 are the same handshape). Lessons keep
  curriculum order, quizzes shuffle.
- **Culture** only appears when `lesson.culture` is set [S.26].
- A lesson with no items gets `steps: []`.
- Both modes build every part of the plan, so the rng is consumed the same way and a seed gives the same Recognize
  questions in either mode. That's what lets `remapSession` move a session between modes.
- **Quiz / review sampling**: up to `QUIZ_RECOGNIZE_CAP` (20) Recognize questions and `QUIZ_SIGN_CAP` (10) Sign
  tasks. They're picked round-robin across `lesson.covers` (each item counts for the first covered lesson that has
  it), with the lesson order shuffled, and then shuffled again. That way 1.2's 26 letters can't crowd out the other
  lessons. `allowed` is still built from the **full** recognizable same-kind set of the quiz, not just the sample,
  so rejection behaves the way it was tuned.

`seededRng(seed)` (mulberry32) makes the plan reproducible. The seed is saved with the resume point, so a resumed lesson
shows the same question order and choices it showed before.

## lessonSession.ts
Pure step machine over a plan. `SessionState = { stepIndex, itemIndex, answers }`. Answers are keyed by `"step:item"`:
`recognize` (first choice), `learn` (correct-sign count per card), `sign` (`{ correct, hinted, missed }`).
- `canNext`: Recognize waits for an answer, a Learn card for `LEARN_REPS` correct signs (watch-only cards don't
  wait), a Sign task for one correct sign. Watch and Culture never block. There is no skip: tries are unlimited, and
  Sign always has the hint.
- `answerRecognize` keeps only the first answer. `recordLearn` counts correct signs only. `recordSign` and
  `showSignHint` return `newMiss` the first time a task is missed or hinted, so weak_signs gets one miss per task, not
  one per try.
- `sessionStats`: total = Recognize questions + Sign tasks. correct = first Recognize answers that were right + Sign
  tasks signed correctly before the hint was opened. Learn is practice and isn't scored. signs = distinct lesson
  items. The culture question isn't scored.
- `fitSession` restarts a saved position that no longer fits the plan (the curriculum changed).
- `remapSession(from, to, s)` moves a session to the other mode's plan: Learn ↔ Watch, every other step to the same
  kind. Answers follow their step. A position on Sign (no Watch counterpart) moves to the next step that exists, or
  to the last item so Next finishes.
- `serializeAnswers(answers, mode)` / `parseAnswers` handle the `lesson_progress.answers` jsonb, with items stored as
  item keys and the mode as `m`. Parsing is tolerant: anything malformed is dropped. A row without `m` (saved before
  Learn/Sign existed) parses with `mode: null`, and the session restarts it.
