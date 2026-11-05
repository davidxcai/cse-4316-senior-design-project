# Signify Component Tree (M1)

Built from `reference/wireframes.md` and `reference/ui-demo-features.md`. Only `[keep]` items are mapped. IDs in brackets point back to those docs.

Stack today: React 19, Vite, Tailwind 4, daisyUI 5. There is no router, store, server-state library or backend yet (see §6).

---

## 1. Layers

```
domain/        pure TS: curriculum data, unlocking, streaks, weak-sign rules, scoring
recognition/   camera → landmarks → segmenter → preprocess → model (today's src/lib/)
api/           backend calls (user, progress, streak, weak signs); backend TBD
store/         client-only state: sidebar, in-flight lesson/practice session
features/*/hooks/       orchestration: read store/queries, call domain, drive recognition
features/*/components/  render only
components/    shared UI used by 2+ features
types/         shared types by domain
```

Components never contain unlock, streak, scoring or "3 in a row" logic. That lives in `domain/`.

---

## 2. Shells and routing

```
App
├── PublicShell                      signed out, no sidebar [SB.8]
│   ├── TopNav                       logo, Sign in, Sign up [LP.1–2]
│   └── routes
│       ├── /           LandingPage
│       ├── /sign-in    SignInPage
│       └── /sign-up    SignUpPage
│
└── AppShell                         signed in [1.1a]
    ├── Sidebar                      expanded by default on fresh visit [SB.7]
    └── routes
        ├── /                  HomePage
        ├── /unit/:unitId      UnitPage            (Learn)
        ├── /lesson/:lessonId  LessonPage          focus mode [SB.4]
        ├── /practice          PracticePage        session = focus mode [SB.4]
        └── /profile           ProfilePage
```

Focus mode isn't a separate shell. The route tells `AppShell` to start the sidebar collapsed.

---

## 3. Shared components (`src/components/`)

These are reused across features. Building a second version of any of them is a §3 violation in `component-conventions`.

### Sidebar
```
Sidebar                    collapsed | expanded | hover-expanded overlay [SB.1–3]
├── Logo
├── NavItem ×2             Home, Practice; icon + label, icon only when collapsed [2.2, 2.4, 2.7]
├── CollapseToggle         « / » [SB.1]
└── UserCard               avatar, name, chevron → /profile [2.10–2.13]
```

### Sign exercise kit
Used by Lesson, Practice and the landing demo.

```
SignVideo                  looping video, replay, ½× [S.7–8, S.12, LP.3]
GlossLabel                 HELLO + meaning; handshape notes behind `showHandshapeNotes` [S.9–11]
SignCamera                 camera + landmark overlay; wraps today's CameraStage [S.15, LP.4]
├── RecordingIndicator     [S.18]
└── CameraError            no webcam / permission denied / in use + Retry [C.1–3]
SignResult                 ✓ / ✗, on ✗ also predicted sign + confidence [S.19, S.21–22]
ChoiceGrid                 4 answer buttons + ✓ / ✗ reveal [S.13–14, S.25]

LearnCard        = SignVideo + GlossLabel                       [3b]
RecognizeCard    = SignVideo + ChoiceGrid                       [3c]
ProduceCard      = SignCamera + GlossLabel + small SignVideo
                   + SignResult + Retry / Next                  [3d]
```

`LearnCard`, `RecognizeCard` and `ProduceCard` are the only exercise components. The lesson, practice and landing pages arrange them; they never copy them.

### Small primitives
```
StatItem                   icon + value: 🔥 12, ★ 18, ▣ 1/5, ✋ 54 [H.1, R.3, S.28]
ProgressBar                daisyUI progress + optional "n/m" [5.9, L.3, S.3]
StatusIcon                 done ✓ / current ● / locked 🔒 [5.5, L.4]
UnitTile                   number tile with icon + color [5.3, L.2]
SessionSummary             result stats + two actions; used by LessonComplete and PracticeSummary [3f, P.9]
```

---

## 4. Feature trees (`src/features/`)

### landing
```
LandingPage
├── TryItHero                       [L0b]
│   ├── LearnCard (HELLO)
│   ├── ProduceCard (HELLO)         right hand, no toggle [LP.9]
│   │   └── StartCameraButton       nothing loads until click [LP.6]
│   └── on ✓: "Nice job!" + Learn more → /sign-up [LP.8]
├── HowItWorksSection               [LP.10]
├── CurriculumSection               [LP.11]
├── MissionSection                  [LP.12]
├── PrivacySection                  [LP.13]
└── Footer                          [LP.14]
hooks: useTryItDemo
```

### auth
```
SignInPage                          email + password [A.1]
SignUpPage                          two steps [A.6]
├── AccountStep                     email + password
└── ProfileStep                     name + dominant hand [A.3, A.5]
hooks: useAuth (wraps the backend's auth)
```

### home
```
HomePage
├── StreakBanner                    [4.3, 4.5, H.1]
│   ├── WeekStrip                   M–S with ✓ / today / future
│   ├── StatItem 🔥 current, StatItem ★ best
│   └── ResumeButton                "Resume Unit N" → current lesson
└── UnitList                        heading "Units" [5.1a]
    ├── ViewAllToggle               current + 2 ahead ↔ all [5.2, 5.2a]
    └── UnitRow ×n                  [5.3–5.10]
hooks: useStreak, useUnitOverview
```

### unit (Learn page)
```
UnitPage
├── UnitHeader                      UnitTile, label, title, ProgressBar [L.2–3]
└── LessonList
    └── LessonRow ×n                kind: lesson | quiz | review [L.4, L.6–7]
hooks: useUnit
```
One `LessonRow` with a `kind` prop, not separate quiz and review row components.

### lesson
```
LessonPage
├── LessonFrame                     [3a]
│   ├── ExitButton                  ✕ → unit page [S.1]
│   ├── StepIndicator               Learn · Recognize · Produce · Culture [S.2]
│   ├── ProgressBar                 n/m in current step [S.3]
│   └── PrevNext                    [S.4]
├── step content (one of)
│   ├── LearnCard
│   ├── RecognizeCard
│   ├── ProduceCard                 misses feed Weak [S.23]; blocks completion without camera [C.5]
│   └── CultureStep                 reading + ChoiceGrid; skipped if none [S.24–26]
└── LessonComplete                  SessionSummary + Redo / Next lesson [S.27–29]
hooks: useLessonSession (step machine, saves progress for Resume [S.6])
```

### practice
```
PracticePage
├── PracticeSetup                   [4a]
│   ├── ModeToggle                  Pick | Weak [P.1]
│   ├── LessonPicker                completed lessons only, grouped by unit [P.2–3]
│   └── EmptyWeak                   icon + "None yet" [P.6]
├── PracticeSession                 focus mode [4b]
│   ├── RecognizeCard | ProduceCard mixed, random order [P.5, P.7]
│   ├── Tally                       ✓ n  ✗ n [P.8]
│   └── StopButton                  [P.9]
└── PracticeSummary                 SessionSummary + missed list [P.9]
hooks: usePracticeSession (endless rotation, mastery drop-out [P.4], Weak updates [P.10])
```

### profile
```
ProfilePage
├── ProfileHeader                   avatar, name, edit [R.1–2]
├── StatsRow                        4 × StatItem [R.3]
├── Settings
│   ├── CameraSelect                [R.4]
│   └── HandSelect                  [R.5]
└── SignOutButton                   [R.7]
hooks: useProfile, useCameraDevices
```

---

## 5. Domain and recognition

### `src/domain/` (pure TS, unit-testable)
| Module | Owns |
|--------|------|
| `curriculum.ts` | units → lessons → sign lists, culture notes, review/quiz membership (from `curriculum.md`) |
| `progress.ts` | lesson and unit unlocking [5.11, L.5], unit %, current lesson for Resume |
| `streak.ts` | a day counts if ≥1 lesson completed [7.4]; current and best |
| `weakSigns.ts` | add on miss [S.23]; remove after 3 correct in a row [P.10] |
| `practice.ts` | rotation, mastery threshold [P.4, threshold TBD] |
| `scoring.ts` | prediction + target + cutoff → correct / wrong / rejected [S.19] |

### `src/recognition/` (today's `src/lib/` + `useSignRecognizer`)
Changes the UI needs from it:

| Need | Why |
|------|-----|
| Restrict predictions to an allowed label set per lesson / practice session / review | curriculum-scoped recognition |
| Reject below a confidence cutoff instead of forcing a guess | ✗ "not recognized" [S.19] |
| Return top prediction + confidence on every attempt | [S.21–22] |
| Mirror input from the saved dominant hand; remove the Mirror toggle | [R.5, LP.9] |
| Start on demand, not on mount | [LP.6] |
| Typed camera errors: `not-found`, `not-allowed`, `in-use` | [C.1–3] |
| Expose a single-target "attempt" API (`expect: "HELLO"` → result) alongside the free-running stream | Produce step, landing demo |
| One recognizer instance shared across pages (models load once) | performance |
| One call that routes by item type: word signs → sign GRU, static letters/digits → handshape model, J/Z → `checkMotionLetter` | ProduceCard stays model-agnostic |
| J/Z verdicts as a typed union (`no-hand` / `wrong-handshape` / `no-motion` / `wrong-path`), shown as short labels on ✗ | [S.19] |

Ownership: the ML session (`cse-4316-senior-design-project-48`) owns `src/lib/**`, `src/recognition/**` and the recognizer hook. The UI session owns pages and components and imports **only from `src/recognition`**. Agreed 2026-11-04.

### Recognition API contract (from ML session; field names final)

```ts
type Item =
  | { kind: "sign"; gloss: string }      // ASL Citizen gloss ids; ML exports a gloss list
  | { kind: "letter"; char: string }     // "A".."Z"
  | { kind: "number"; value: number };   // 0..29 for now

type MotionReason = "no-hand" | "wrong-handshape" | "no-motion" | "wrong-path";

interface AttemptResult {
  verdict: "correct" | "wrong" | "rejected";
  expected: Item;
  predicted: Item | null;   // best guess even on reject; null only if no hand seen
  confidence: number;       // 0..1, display only
  reason?: MotionReason;    // J/Z only, on ✗
}

type CameraError = "not-found" | "not-allowed" | "in-use";
type RecognizerError = { type: "camera"; code: CameraError } | { type: "model-load" };
type AttemptPhase = "waiting" | "recording" | "processing";

interface Recognizer {
  start(video: HTMLVideoElement, opts: { dominantHand: "left" | "right" }): Promise<void>;
  stop(): void;
  attempt(
    req: { expect: Item; allowed: Item[] },
    opts?: { signal?: AbortSignal; onPhase?: (p: AttemptPhase) => void },
  ): Promise<AttemptResult>;
}
```

- One shared instance via React context + `useRecognizer()`. Nothing loads until `start()`.
- `attempt()` routes internally to the sign model, the handshape model or the J/Z motion check.
- `allowed` = the lesson or review list. `expect` is added automatically if missing.
- A free-running `onPrediction` stream is available on request.
- `isRecognizable(item: Item): boolean` is exported from `src/recognition`. It's synchronous, reads a static coverage list, and works before `start()`. The ML session owns the list. The UI uses it to skip Produce for unsupported items [S.30] and never keeps its own list.
- DON'T-LIKE (curriculum) maps to ASL Citizen gloss `DONTLIKE`, which has 31 clips from 29 signers.

### Attempt behavior the UI must handle
- An attempt starts when a hand enters view. It ends 700 ms after the hands leave view, or after 6 s.
- It needs about 8+ frames with a hand.
- Shoulders must be in frame, so frame the user from mid-chest up. Camera: 640×480, front-facing.
- `signal` aborts an attempt (for a manual "done" control).
- On ✗: word signs show "predicted (confidence)"; J/Z show the `reason` label.

### Coverage gaps (2026-11-04)
- Build order: (i) attempt API on today's model; (ii) retrain the sign model on Unit 1–2 words, HELLO included; (iii) the handshape model for A–Z and 0–9.
- HELLO is not in today's model and needs step (ii).
- The motion check is weak for Z (about 40% recall), so expect false ✗ on Z.
- Numbers: 0–9 come from the handshape model and 11 has ASL Citizen clips. **10 and 12–29 have no data source**, so those lessons need a "recognition unavailable" state.
- ~~NOT-LIKE isn't an ASL Citizen gloss.~~ Resolved: the curriculum uses DON'T-LIKE, mapped to `DONTLIKE`.
- Reference videos have **no cleared source**. ASL Citizen is under Microsoft's research terms, and WLASL clips are private-research only. Licensing is the user's decision.
- Mastery [P.4]: use counts (correct on N of the last M attempts), not a confidence threshold. Confidence is for display only.

Known ML state (from that session, 2026-11-04):
- Sign GRU not yet retrained.
- Planned: per-lesson allowed-label list + out-of-subset rejection in `predict()` (`src/lib/signModel.ts`).
- Planned: a separate handshape model for A–Z and 0–9 (ASL-HG data).
- Built, not wired: `checkMotionLetter(frames, "J" | "Z")` in `src/lib/fingerspell/motionLetters.ts`.
- Sentences out of scope.

---

## 6. Open technical decisions

| Decision | Choice | Notes |
|----------|--------|-------|
| Router | **TanStack Router** | 8 routes, typed params; signed-in vs signed-out guard picks `PublicShell` / `AppShell` |
| Client store | **Zustand, only if needed** | candidates: sidebar collapse/hover, in-flight lesson/practice session. Start with local state + context; add Zustand when state is shared across distant components |
| Server state | **TanStack Query** | user, progress, streak, weak signs; Supabase calls live in `src/api/`, consumed via query/mutation hooks |
| Backend + auth | **Supabase** | email/password [A.1]; tables for profiles (name, dominant hand), progress, streak days, weak signs |
| Icon set | **Tabler Icons** (`@tabler/icons-react`) | one set only (`signify-ui`) |
| UI library | **daisyUI 5** (already installed) | prebuilt components first; custom only if daisyUI has nothing that fits (see `signify-ui` §2a) |
| Sign video source | **YouTube embeds** | video id + start/end per sign [S.7] |
