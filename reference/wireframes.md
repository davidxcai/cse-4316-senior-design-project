# Signify Wireframes (M1)

Low-fidelity wireframes for every M1 page. Home follows `reference/ui-demo-features.md`. The other pages are drafts to review, using the same status markers: `[ ]` undecided, `[keep]`, `[later]`, `[cut]`.

Symbols are placeholders for icons from the single icon set, not final glyphs.

Shared shell on every page: the sidebar (logo, Home, Practice, user card at the bottom) and the main content area.

## 0. Sidebar states

```
 Expanded            Collapsed (icon rail)     Collapsed + hover
┌──────────────┐     ┌────┐                    ┌──────────────┐
│ ✋ signify  « │     │ ✋ │                    │ ✋ signify  » │  ← overlays the
│ ⌂ Home       │     │ ⌂  │                    │ ⌂ Home       │    page, doesn't
│ ✳ Practice   │     │ ✳  │                    │ ✳ Practice   │    push content
│              │     │    │                    │              │
│ (AJ) Alex  > │     │(AJ)│                    │ (AJ) Alex  > │
└──────────────┘     └────┘                    └──────────────┘
```

| ID   | Feature | Status |
|------|---------|--------|
| SB.1 | Collapse/expand toggle (« / ») | [keep] |
| SB.2 | Collapsed state: icon rail with no labels; icon-only items get `aria-label` | [keep] |
| SB.3 | Hover over the collapsed rail: it temporarily expands as an overlay and collapses again on mouse leave | [keep] |
| SB.4 | Lessons and Practice sessions (focus mode) start with the sidebar collapsed | [keep] |
| SB.5 | Collapse toggle pins the sidebar expanded or collapsed | [keep] |
| SB.6 | ~~Remember the user's collapse choice~~ | [cut] |
| SB.7 | A fresh page visit (signed in) opens Home with the sidebar expanded | [keep] |
| SB.8 | The sidebar exists only for signed-in users. Signed-out visitors get the landing page's top navbar (see L0) | [keep] |

---

## L0. Landing page (signed out)

What visitors without an account see. No sidebar. The hero is a working "try it" demo: learn HELLO, then sign it to the camera.

```
┌─────────────────────────────────────────────────────────────┐
│ ✋ signify                              [Sign in] [Sign up] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌───────────────────────┐   ┌──────────────────────────┐  │
│   │                       │   │                          │  │
│   │   (HELLO sign video)  │   │  (camera + landmarks)    │  │
│   │                       │   │   [◎ Start camera]       │  │
│   └───────────────────────┘   └──────────────────────────┘  │
│                         HELLO                               │
│                    ● recording  →  ✓ / ✗                    │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│   How it works · Curriculum · Mission · Privacy             │
│   ...                                                       │
├─────────────────────────────────────────────────────────────┤
│   (footer)                                                  │
└─────────────────────────────────────────────────────────────┘
```

### L0a. Top navbar

| ID   | Feature | Status |
|------|---------|--------|
| LP.1 | Logo on the left | [keep] |
| LP.2 | Sign in and Sign up buttons on the right | [keep] |

### L0b. Hero: "Try it"

| ID   | Feature | Status |
|------|---------|--------|
| LP.3 | HELLO sign video (reuses Learn step, 3b) | [keep] |
| LP.4 | Live camera with hand tracking (reuses Produce step, 3d) | [keep] |
| LP.5 | Recognizer checks HELLO and shows ✓ / ✗ | [keep] |
| LP.6 | "Start camera" button: camera permission and model download happen only on click, never on page load | [keep] |
| LP.7 | Retry button | [keep] |
| LP.8 | After a ✓: show "Nice job!" and a "Learn more" button that goes to the Sign up page | [keep] |
| LP.9 | Dominant hand: right-handed by default, no toggle | [keep] |

> note: "Nice job!" is user-specified copy, an approved exception to the `signify-ui` no-cheerful-copy rule.
> note: the current model has no HELLO label. The model rework in a separate session covers introductions, including HELLO.

### L0c. Below the hero

Content describing what the project aims to do. Copy is TBD.

| ID    | Section | Status |
|-------|---------|--------|
| LP.10 | How it works: Learn → Recognize → Produce, as three icons | [keep] |
| LP.11 | Curriculum overview: the 6 units | [keep] |
| LP.12 | Mission / about the project and team | [keep] |
| LP.13 | Privacy: camera video is processed in the browser and never uploaded | [keep] |
| LP.14 | Footer | [keep] |

---

## 1. Home

```
┌──────────────┬──────────────────────────────────────────────┐
│ ✋ signify   │ ┌──────────────────────────────────────────┐ │
│              │ │ M  T  W  T  F  S  S        🔥 12   ★ 18  │ │
│ ⌂ Home       │ │ ✓  ✓  ✓  ✓  ✓  ○  ·                      │ │
│ ✳ Practice   │ │                          [▶ Resume Unit 1]│ │
│              │ └──────────────────────────────────────────┘ │
│              │                                              │
│              │ Units                              [≡ All]   │
│              │ ┌──────────────────────────────────────────┐ │
│              │ │ [01] UNIT 1 · In progress              > │ │
│              │ │      Introducing Oneself                 │ │
│              │ │      Greetings, alphabet, numbers 1–15   │ │
│              │ │      ▤ 4   ◷ 20m   ▬▬▬▬▬▬──────          │ │
│              │ └──────────────────────────────────────────┘ │
│              │ ┌ [02] UNIT 2 ─────────────────────────── > ┐ │
│              │ └ [03] UNIT 3 · 🔒 ───────────────────────── ┘ │
│              │                                              │
│ (AJ) Alex  > │                                              │
└──────────────┴──────────────────────────────────────────────┘
```

Already decided in `ui-demo-features.md`. One open item:

| ID  | Feature | Status |
|-----|---------|--------|
| H.1 | Best-streak display: "★ 18" icon + value | [keep] |

> note: H.1 repeats a Profile stat on purpose. Home is the consolidated overview, so a small amount of overlap with other pages is fine there.

---

## 2. Learn (unit page)

Opened from a unit row's arrow on Home. Shows one unit's lessons and checkpoints.

```
┌──────────────┬──────────────────────────────────────────────┐
│ sidebar      │ [01] UNIT 1                                  │
│              │      Introducing Oneself                     │
│              │      ▬▬▬▬▬▬▬▬▬▬──────────  2/4               │
│              │                                              │
│              │ ┌──────────────────────────────────────────┐ │
│              │ │ ✓  1.1  Greetings          ✋ 13       > │ │
│              │ ├──────────────────────────────────────────┤ │
│              │ │ ✓  1.2  Alphabet           ✋ 26       > │ │
│              │ ├──────────────────────────────────────────┤ │
│              │ │ ●  1.3  Numbers 1–15       ✋ 15       > │ │
│              │ ├──────────────────────────────────────────┤ │
│              │ │ 🔒 1.4  Shapes & Colors    ✋ 11         │ │
│              │ ├──────────────────────────────────────────┤ │
│              │ │ 🔒 ✎   Unit Quiz                         │ │
│              │ └──────────────────────────────────────────┘ │
│              │                                              │
│              │ (Unit 2 also ends with a ⟲ Review A row)     │
└──────────────┴──────────────────────────────────────────────┘
```

| ID   | Feature | Status |
|------|---------|--------|
| L.1  | ~~Back link to Home~~ (the sidebar already links Home) | [cut] |
| L.2  | Unit header: number tile, unit label, title | [keep] |
| L.3  | Unit progress bar with lessons done / total | [keep] |
| L.4  | Lesson rows: status icon (done ✓ / current ● / locked 🔒), number, title, sign count, arrow | [keep] |
| L.5  | Sequential lesson unlocking inside a unit | [keep] |
| L.6  | Unit Quiz row at the end of every unit (receptive quiz + expressive check, per `curriculum.md`) | [keep] |
| L.7  | Review row (Review A, Review B, Final) at the end of Units 2, 4 and 5 | [keep] |
| L.8  | Completed lessons can be reopened | [keep] |

---

## 3. Lesson

Opened from a lesson row. Focus mode: the sidebar starts collapsed to the icon rail (see 0). Follows the curriculum's lesson template: Learn → Recognize → Produce → Culture. (Part 4, sentences, is M2.)

### 3a. Lesson frame

```
┌────┬────────────────────────────────────────────────────────┐
│ ✋ │ ✕  1.1 Greetings  ◉ Learn ─ ○ Recognize ─ ○ Produce ─ ○ Culture │
│ ⌂  │    ▬▬▬▬▬▬▬──────────────────────────────  3/13          │
│ ✳  ├────────────────────────────────────────────────────────┤
│    │                                                        │
│    │                   (step content)                       │
│    │                                                        │
│(AJ)├────────────────────────────────────────────────────────┤
│    │  [←]                                             [→]   │
└────┴────────────────────────────────────────────────────────┘
```

| ID   | Feature | Status |
|------|---------|--------|
| S.1  | Exit button (✕) back to the unit page | [keep] |
| S.2  | Step indicator: Learn, Recognize, Produce, Culture | [keep] |
| S.3  | Progress bar with item count within the current step | [keep] |
| S.4  | Previous / next buttons | [keep] |
| S.5  | Focus mode: sidebar collapsed to the icon rail during a lesson (see SB.4) | [keep] |
| S.6  | Leaving mid-lesson saves progress, so "Resume" continues from there | [keep] |

### 3b. Learn step

```
│            ┌───────────────────────────────┐                │
│            │                               │                │
│            │         (sign video)          │                │
│            │                               │                │
│            └───────────────────────────────┘                │
│                 ⟲  ½×                                       │
│                                                             │
│                        HELLO                                │
│                        hello                                │
```

| ID   | Feature | Status |
|------|---------|--------|
| S.7  | Looping sign video, from an embedded YouTube clip by a fluent signer (see note) | [keep] |

> note: reference videos come from YouTube embeds (video id + start/end time per sign), since no dataset clips are cleared for redistribution. Nothing is stored on our side. Open issues: (1) the YouTube title overlay can reveal the answer in Recognize steps, so it needs a cover or crop; (2) clips can be removed by their owner; (3) which channels to use is TBD.
| S.8  | Replay and slow-motion controls | [keep] |
| S.9  | Gloss (HELLO) | [keep] |
| S.10 | English meaning | [keep] |
| S.11 | Handshape notes, behind a killswitch flag (`showHandshapeNotes`) so they can be turned off at any time | [keep] |

> note: S.11 is on for now to see how it looks. One flag turns it off everywhere, with no layout changes needed.

### 3c. Recognize step

```
│            ┌───────────────────────────────┐                │
│            │         (sign video)          │                │
│            └───────────────────────────────┘                │
│                                                             │
│          [ THANK-YOU ]          [ HELLO ]                   │
│          [ PLEASE    ]          [ SORRY ]                   │
│                                                             │
│                     ✓  /  ✗ HELLO                           │
```

| ID   | Feature | Status |
|------|---------|--------|
| S.12 | Sign video, no gloss shown | [keep] |
| S.13 | Four answer choices | [keep] |
| S.14 | Result: ✓, or ✗ with the correct answer | [keep] |

### 3d. Produce step

```
│   ┌──────────────────────────────┐   ┌──────────────────┐   │
│   │                              │   │                  │   │
│   │   (camera + hand landmarks)  │   │  (reference      │   │
│   │                              │   │   video, small)  │   │
│   │                              │   └──────────────────┘   │
│   └──────────────────────────────┘                          │
│                                                             │
│                        HELLO                                │
│                   ● recording   →   ✓ / ✗                   │
│                     [⟲ Retry]   [→ Next]                    │
```

| ID   | Feature | Status |
|------|---------|--------|
| S.15 | Live camera with hand-landmark overlay (existing `CameraStage`) | [keep] |
| S.16 | Target gloss to sign | [keep] |
| S.17 | Small reference video of the sign | [keep] |
| S.18 | Phase cue, icon + casual word: ✋ "Ready" (waiting for hands) → ● "Watching" (signing) → ⋯ "Checking" (processing) | [keep] |
| S.19 | Result: ✓ / ✗ (✗ also covers "not recognized" when below the confidence cutoff) | [keep] |
| S.20 | Retry button | [keep] |
| S.21 | Show what the model thought you signed, on ✗ | [keep] |
| S.22 | Confidence score display | [keep] |
| S.23 | Failed signs are saved for Practice "Weak" mode (see 4) | [keep] |
| S.30 | Items with no recognition support skip the Produce step and don't block lesson completion (today: numbers 10 and 12–29) | [keep] |

> note: S.30 is temporary. We'll revisit once there's data for those numbers.

### 3e. Culture step

```
│   (title)                                                   │
│   (reading: short text + optional image)                    │
│                                                             │
│   (one quiz question)                                       │
│   [ A ]  [ B ]  [ C ]  [ D ]                                │
```

| ID   | Feature | Status |
|------|---------|--------|
| S.24 | Culture reading (title + body) | [keep] |
| S.25 | One quiz question | [keep] |
| S.26 | Lessons without a culture note skip this step | [keep] |

### 3f. Lesson complete

```
│                          ✓                                  │
│                    1.1 Greetings                            │
│              ✋ 13     ✓ 11/13     🔥 13                    │
│                                                             │
│              [⟲ Redo]        [→ Next lesson]                │
```

| ID   | Feature | Status |
|------|---------|--------|
| S.27 | Completion screen | [keep] |
| S.28 | Stats: signs, correct count, updated streak | [keep] |
| S.29 | Redo and Next lesson buttons | [keep] |

---

## 4. Practice

Free practice with no lesson structure. Uses only signs from lessons the user has completed.

### 4a. Setup

```
┌──────────────┬──────────────────────────────────────────────┐
│ sidebar      │ Practice                                     │
│              │                                              │
│              │ [✋ Pick]   [⚠ Weak]                          │
│              │                                              │
│              │ ▾ Unit 1                                     │
│              │   ☑ 1.1 Greetings      ✋ 13                  │
│              │   ☑ 1.2 Alphabet       ✋ 26                  │
│              │   ☐ 1.3 Numbers 1–15   ✋ 15                  │
│              │ ▸ Unit 2  🔒                                  │
│              │                                              │
│              │                                [▶ Start]     │
└──────────────┴──────────────────────────────────────────────┘
```

| ID   | Feature | Status |
|------|---------|--------|
| P.1  | Mode toggle: Pick (choose lessons) / Weak (signs you've missed) | [keep] |
| P.2  | Lesson picker grouped by unit, with checkboxes | [keep] |
| P.3  | Only completed lessons are selectable | [keep] |
| P.4  | ~~Round length: 10 / 20 / endless~~ No length picker. Sessions are endless: they run until the user stops, or until every selected sign is signed with high enough accuracy | [keep] |
| P.5  | Mixed practice: both Recognize (watch, pick the meaning) and Produce (sign to the camera) items | [keep] |
| P.6  | Weak mode, empty state: icon + "None yet" | [keep] |

> note: P.4 "signed it well enough" is count-based (correct on N of the last M attempts), on the ML session's advice; confidence is too noisy across signers to threshold. N and M are TBD.

### 4b. Session

Reuses the Recognize (3c) and Produce (3d) step layouts in focus mode, plus:

| ID   | Feature | Status |
|------|---------|--------|
| P.7  | Random order of the selected signs | [keep] |
| P.8  | Running tally: ✓ correct, ✗ missed (no total, since sessions are endless) | [keep] |
| P.9  | Stop button; summary on stop or finish: tally and a list of missed signs | [keep] |
| P.10 | 3 correct in a row removes a sign from Weak | [keep] |

---

## 5. Profile

Opened from the sidebar user card.

```
┌──────────────┬──────────────────────────────────────────────┐
│ sidebar      │ (AJ)  Alex Johnson                    [✎]    │
│              │                                              │
│              │ 🔥 12    ★ 18    ▣ 1/5    ✋ 54               │
│              │                                              │
│              │ ⚙ Settings                                   │
│              │   ◎ Camera          [ FaceTime HD     ▾ ]    │
│              │   ⇄ Hand            [ Right ▾ ]              │
│              │                                              │
│              │ [⎋ Sign out]                                 │
└──────────────┴──────────────────────────────────────────────┘
```

| ID   | Feature | Status |
|------|---------|--------|
| R.1  | Avatar (initials) and display name | [keep] |
| R.2  | Edit name | [keep] |
| R.3  | Stats row: current streak, best streak, units completed, signs learned | [keep] |
| R.4  | Camera picker | [keep] |
| R.5  | Dominant hand (left/right): set at sign-up (A.5), changeable here anytime | [keep] |
| R.6  | Reminder notifications on/off | [later] |

> note: R.5 replaces the "Mirror input" toggle in the current `src/App.tsx`. The recognizer mirrors input based on the saved dominant hand, so there's no mirror button anywhere in the UI.
| R.7  | Sign out | [keep] |
| R.8  | Delete account | [later] |

---

## 6. Notifications panel [later]

Deferred: there's no reason to use notifications yet. Opened from the bell at the bottom of the sidebar. A popover, not a page.

```
┌──────────────────────────┐
│ 🔥 Streak ends tonight   │
│ 🔓 Unit 2 unlocked       │
│ ...                      │
└──────────────────────────┘
```

| ID   | Feature | Status |
|------|---------|--------|
| N.1  | Popover list of notifications, icon + a few words each | [later] |
| N.2  | Streak-at-risk reminder | [later] |
| N.3  | Unit unlocked | [later] |
| N.4  | Unread dot on the bell | [later] |
| N.5  | Empty state: icon + "None" | [later] |

---

## 7. Auth (sign in / sign up)

Needed by user accounts (7.1). No mockup yet.

```
┌─────────────────────────────────────────────────────────────┐
│                       ✋ signify                             │
│                                                             │
│                  [ Email            ]                       │
│                  [ Password         ]                       │
│                  [ → Sign in ]                              │
│                  Sign up                                    │
└─────────────────────────────────────────────────────────────┘
```

| ID   | Feature | Status |
|------|---------|--------|
| A.1  | Email + password sign in / sign up | [keep] |
| A.2  | Third-party sign-in (e.g., Google) | [later] |
| A.3  | Name entered at sign-up | [keep] |
| A.4  | ~~Camera permission step after sign-up~~ (the browser asks at the first camera use) | [cut] |
| A.5  | Dominant hand (left/right) chosen at sign-up | [keep] |
| A.6  | Sign-up in two steps: (1) email + password, (2) name + dominant hand | [keep] |

```
 Step 1                         Step 2
┌──────────────────────────┐   ┌──────────────────────────┐
│ ✋ signify          1/2   │   │ ✋ signify          2/2   │
│ [ Email            ]     │   │ [ Name             ]     │
│ [ Password         ]     │   │ ⇄ [ Right ] [ Left ]     │
│ [→ Next]                 │   │ [→ Start]                │
└──────────────────────────┘   └──────────────────────────┘
```

---

## 8. No camera / camera errors

Every camera view (landing hero, lesson Produce step, Practice) needs a state for when the camera can't be used. Each error case has its own message.

```
┌──────────────────────────────┐
│                              │
│            ◎̸                 │
│    No webcam detected        │
│    A webcam is required      │
│                              │
└──────────────────────────────┘
```

| ID  | Feature | Status |
|-----|---------|--------|
| C.1 | No camera found: icon + "No webcam detected" + "A webcam is required" (user-specified copy) | [keep] |
| C.2 | Permission denied: its own icon + short message on re-enabling camera access in the browser | [keep] |
| C.3 | Camera in use by another app: its own icon + short message + Retry | [keep] |
| C.4 | Only camera views are blocked: lesson Produce steps, Practice signing items, landing demo. Learn, Recognize, Culture and Practice Recognize items still work | [keep] |
| C.5 | A lesson can't be completed without its Produce step, so progress stops at the first Produce step until the camera works | [keep] |

> note: exact wording for C.2 and C.3 is TBD. Keep it short (icon + a few words), per `signify-ui`.
