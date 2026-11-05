# UI Demo: Feature Breakdown

Source: `reference/ui-demo.png` (Home / dashboard screen)

Each feature is marked with a status in brackets. Change it as we review:

- `[ ]` undecided
- `[keep]` build it
- `[later]` deferred, e.g. to Milestone 2 or a stretch goal
- `[cut]` discard

Notes go under a feature as `> note:` lines.

---

## 1. App Shell / Layout

| ID  | Feature | Status |
|-----|---------|--------|
| 1.1 | ~~Three-column layout: sidebar, main content, right widget column~~ | [cut] |
| 1.1a | Two-column layout for M1: sidebar and main content; banner and units span the full main width | [keep] |
| 1.1b | Right column returns when the leaderboard (6b) is built | [later] |
| 1.2 | Responsive collapse (sidebar on smaller screens); implied, not shown | [later] |
| 1.3 | Collapsible sidebar: icon rail, hover-to-expand overlay, auto-collapsed in focus mode (see `wireframes.md` §0) | [keep] |

> note: mobile is out of scope for M1. Desktop/laptop only.

---

## 2. Sidebar (`Sidebar`)

### 2a. Branding
| ID  | Feature | Status |
|-----|---------|--------|
| 2.1 | Logo: hand icon and "signify" wordmark (Signify is the real product name) | [keep] |

### 2b. Navigation (`NavMenu`, `NavItem`)
| ID  | Feature | Status |
|-----|---------|--------|
| 2.2 | Home | [keep] |
| 2.3 | ~~Learn (nav item)~~ | [cut] |
| 2.4 | Practice: no lesson structure; user picks what to practice, or practices signs they've struggled with | [keep] |
| 2.5 | Leaderboard | [later] |
| 2.6 | ~~Profile~~ | [cut] |
| 2.7 | Active-state styling: highlighted background and indicator dot | [keep] |

> note: 2.6 is cut as redundant. Profile is reachable only from the sidebar user card (2d).
> note: Practice details come later; for now this is wireframe and feature scope only.
> note: 2.3 is cut as a nav item. Learn is now the unit page, reached from a unit row's arrow (5.10). Home gives the broad overview of units; Learn shows the details of one unit (its lessons and reviews).

### 2c. Upsell card (`UpgradeCard`) [cut]

> note: the space it occupied stays empty. Don't fill it.

| ID  | Feature | Status |
|-----|---------|--------|
| 2.8 | ~~"Unlock Signify+": premium tier promo, "Practice without limits"~~ | [cut] |
| 2.9 | ~~"Explore Plus" button~~ | [cut] |

### 2d. User card (`SidebarUserCard`)
| ID   | Feature | Status |
|------|---------|--------|
| 2.10 | Avatar showing initials | [keep] |
| 2.11 | Display name | [keep] |
| 2.12 | Learner level ("Level 8 learner") | [later] |
| 2.13 | Chevron link to the profile | [keep] |

> note: the second line under the name stays blank until levels (7.3) return.

### 2e. Notifications
| ID   | Feature | Status |
|------|---------|--------|
| 2.14 | Notifications bell and panel (moved from header, was 3.5) | [later] |

> note: the bell sits at the bottom of the sidebar, next to the user card.

---

## 3. Top Header (`TopBar`) [cut]

| ID  | Feature | Status |
|-----|---------|--------|
| 3.1 | ~~Current date label ("MONDAY, MAY 26")~~ | [cut] |
| 3.2 | ~~Time-of-day greeting with the user's name ("Good morning, Alex!")~~ | [cut] |
| 3.3 | ~~Streak pill: flame icon and day count (`StatPill`)~~ | [cut] |
| 3.4 | ~~Gem/currency pill: diamond icon and balance (`StatPill`)~~ | [cut] |
| 3.5 | Notifications bell and panel | moved to sidebar, see 2.14 |
| 3.6 | ~~Avatar button, probably an account menu~~ | [cut] |

> note: 3.3 is cut, not deferred. Streak is shown in the progress banner (4) instead.
> note: 3.6 is cut. The sidebar user card (2d) is the only entry point to Profile.
> note: with everything cut or moved, there is no header bar.

---

## 4. Progress Banner (`ProgressBanner`, replaces `DailyBoostHero`)

The banner shows the user's progress, with a CTA to resume their current unit. It takes the place of the "Ready to make your hands talk?" hero.

| ID  | Feature | Status |
|-----|---------|--------|
| 4.1 | ~~"Your Daily Boost" eyebrow label~~ | [cut] |
| 4.2 | ~~Headline and motivational subtext~~ | [cut] |
| 4.3 | Resume CTA: "Resume Unit N", goes to the current in-progress unit | [keep] |
| 4.4 | ~~Hand illustration with floating letter tiles (decorative)~~ | [cut] |
| 4.5 | Streak: Mon–Sun row with checks, today highlighted, current and best streak (was 6a) | [keep] |
| 4.6 | Daily goal: XP progress (34 / 40) with a progress bar (was 6c) | [later] |

> note: 6.12 (hint text) and 6.13 (status headline) did not move into the banner. Both are subtext, which `signify-ui` forbids.

---

## 5. Learning Path (`PathSection`, `UnitCard`)

### 5a. Section
| ID  | Feature | Status |
|-----|---------|--------|
| 5.1 | ~~"Pick up where you left off" section heading, "YOUR PATH" eyebrow~~ | [cut] |
| 5.1a | Section heading: "Units" | [keep] |
| 5.2 | "View all" filter: expands the list in place to show every unit (not a link to another page) | [keep] |
| 5.2a | Default view: current unit plus up to 2 units ahead | [keep] |

### 5b. Unit card
| ID   | Feature | Status |
|------|---------|--------|
| 5.3  | Unit number tile with a color and icon per unit | [keep] |
| 5.4  | Unit label ("UNIT 1") | [keep] |
| 5.5  | Status badge: In progress / Locked / Completed | [keep] |
| 5.6  | Unit title and one-line description | [keep] |
| 5.7  | Lesson count | [keep] |
| 5.8  | Estimated time | [keep] |
| 5.9  | Progress bar showing % of the unit completed | [keep] |
| 5.10 | Arrow button: opens the unit's Learn page | [keep] |
| 5.11 | Sequential unlocking: later units locked until earlier ones are done | [keep] |

Unit names and contents come from `curriculum.md`, not the mockup:
1. Introducing Oneself
2. Exchanging Personal Information
3. Discussing Living Situations
4. Talking About Family
5. Telling About Activities
6. Storytelling (optional)

> note: review checkpoints (Review A, Review B, Final) are not rows on Home. They live inside their units on the Learn (unit) page. Home stays a broad overview.

---

## 6. Right Column Widgets [later]

> note: the right column is empty for M1 and isn't rendered (see 1.1a).

### 6a. Weekly streak: moved into the progress banner (4.5)

### 6b. Leaderboard (`LeaderboardWidget`, was `LeagueWidget`) [later] (depends on 7.6)
| ID  | Feature | Status |
|-----|---------|--------|
| 6.5 | ~~League tier name and badge ("Sapphire League")~~ | [cut] |
| 6.6 | User's current rank among this month's active users | [later] |
| 6.7 | Monthly XP total | [later] |
| 6.8 | ~~"XP to reach top 3" promotion hint~~ | [cut] |
| 6.9 | Chevron link to the Leaderboard | [later] |

> note: 6.5 and 6.8 are cut because the leaderboard has no tiers or promotion. 6.8 could come back as a "XP to pass the next user" hint.

### 6c. Daily goal: moved into the progress banner (4.6)

> note: 6.12 (hint) and 6.13 (status headline) are cut as subtext.

### 6d. Quote card (`QuoteCard`)
| ID   | Feature | Status |
|------|---------|--------|
| 6.14 | ~~Motivational quote, possibly rotating~~ | [cut] |

---

## 7. Underlying Systems (implied by the UI)

Backend and data concepts the screen depends on. Cutting a system also cuts the UI features that rely on it.

| ID  | System | Used by | Status |
|-----|--------|---------|--------|
| 7.1 | User accounts and profiles (name, avatar) | 2d, 3.2, 3.6 | [keep] |
| 7.2 | XP (daily and monthly totals) | 4.6, 6b | [later] |
| 7.3 | Learner levels | 2.12 | [later] |
| 7.4 | Streaks (current and best, daily history) | 4.5 | [keep] |
| 7.5 | ~~Gems / in-app currency~~ | 3.4 | [cut] |
| 7.6 | Leaderboard: this month's active users ranked by XP accumulated | 6b, 2.5 | [later] |
| 7.7 | Curriculum: units → lessons, with progress tracking | 5 | [keep] |
| 7.8 | Sequential unit unlocking | 5.11 | [keep] |
| 7.9 | Daily goal (configurable XP target?) | 4.6 | [later] |
| 7.10 | Notifications (deferred: no use for them yet) | 2.14 | [later] |
| 7.11 | ~~Premium / subscription tier (Signify+)~~ | 2c | [cut] |

> note: 7.6 was "Leagues"; renamed to Leaderboard. There are no tiers or promotion, just a monthly ranking of active users by XP.
> note: 7.3 (levels) is deferred along with XP (7.2), since levels are calculated from XP.
> note: 7.4 (streaks) moved from later to keep. Until XP and the daily goal exist, a day counts toward the streak if the user completes at least one lesson. Streaks don't depend on XP.

---

## 8. Known Mockup Inconsistencies

- ~~The header date is "Monday, May 26", but the streak widget highlights Saturday as today with day numbers 31 and 32.~~ Resolved: the date label is cut.
- ~~The Unit 3 title is cut off.~~ Resolved: unit names come from `curriculum.md`.
