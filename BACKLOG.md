# 75 Proof — Backlog

> **How to use this file:** Set priority for each item using the `Priority` column.
> - **P0** — Must have, do immediately
> - **P1** — High priority, do this sprint
> - **P2** — Medium priority, next sprint
> - **P3** — Low priority, nice to have
> - **P4** — Someday / icebox
>
> Status: `todo` | `in-progress` | `done` | `blocked`

---

## Bugs & Fixes

| # | Item | Priority | Status | Notes |
|---|------|----------|--------|-------|
| B-1 | Mobile sidebar is non-functional — cannot navigate on mobile screens | | todo | Sidebar does not open/close properly on mobile viewports. Needs a mobile-friendly nav (hamburger menu, bottom nav, or sheet drawer). |
| B-2 | Overscroll background color mismatch on non-homepage routes | | done | Fixed for homepage. Verify other routes match their backgrounds. |

---

## UX / Design Improvements

| # | Item | Priority | Status | Notes |
|---|------|----------|--------|-------|
| D-1 | Today page — remove redundant metrics (streak, days done, remaining days) | | todo | Streak and "days done" duplicate the day counter at the top. Remaining days is shown in the progress flow. Remove all three. |
| D-2 | Today page — remove task category fractions (e.g. "2/3 workouts") | | todo | The fraction of how many tasks are left in each category is unnecessary clutter. |
| D-3 | Today page — reduce overall text density | | todo | Too much text on the page. Tighten copy, remove labels that are self-evident from the UI. |
| D-4 | Today page — clear visual feedback for complete vs incomplete tasks | | todo | Completed tasks need a distinct, satisfying visual state (color change, checkmark animation, strikethrough). Incomplete tasks should feel clearly "open." |
| D-5 | Water intake tracker — simplify to a todo-list style | | todo | Replace the current water tracker with a simple checklist (e.g. 8 x 16oz glasses, tap to check). |
| D-6 | Task detail — support photo upload on all tasks | | todo | "Add details" for each task should allow attaching a photo. |
| D-7 | Progress photo task — open camera directly on mobile | | todo | On Android/iOS, tapping the progress photo task should open the native camera, not the photo gallery. |
| D-8 | Progress page — design improvements | | todo | The progress page is functional but needs design polish. Specific improvements TBD after review. |
| D-9 | Landing page — ensure all mobile breakpoints are polished | | todo | Test the v14 homepage across mobile sizes (320px–428px). |

---

## Onboarding & Auth

| # | Item | Priority | Status | Notes |
|---|------|----------|--------|-------|
| A-1 | Browse-first experience — let new users view the full UI without signing up | | todo | Users should be able to explore the dashboard, Today page, and progress page as a guest. Show a persistent "Sign up to save your progress" prompt. |
| A-2 | One-click sign up process | | todo | Minimize friction: social sign-in (Google, Apple) as primary CTAs, email/password as fallback. No multi-step forms. |
| A-3 | Core authentication flow (Clerk integration) | | todo | Ensure sign-up, sign-in, sign-out, and session management all work end-to-end. |
| A-4 | Health advisory during onboarding | | todo | Show a caring, well-designed health warning screen. Non-blocking but informative. Include "I've reviewed this with my doctor" optional acknowledgment. |

---

## Core Features — Foundation

| # | Item | Priority | Status | Notes |
|---|------|----------|--------|-------|
| F-1 | Basic dashboard UI | | todo | Main authenticated view after login. Show current day, daily tasks, streak. |
| F-2 | Daily check-in card | | todo | Hero component for the Today page. Shows all 6 tasks, tap to complete. |
| F-3 | Standard 75 HARD habit tracking | | todo | Track all 6 default tasks: 2 workouts (1 outdoor), diet, water, reading, progress photo. Enforce the reset-on-miss rule. |
| F-4 | Progress photo upload | | todo | Upload and store daily progress photos via Convex file storage. Generate thumbnails. |
| F-5 | Swipe through previous days — view any past day's log | | todo | User can slide/swipe back to view any previous day's tasks and completion status. Read-only for days older than 2 days. |
| F-6 | Edit past 2 days of logs | | todo | Users can mark tasks as complete or incomplete for today and the previous 2 days only. Days older than that are locked. |
| F-7 | Auto-reset on missed hard task after 2-day grace window | | todo | If a hard-rule task is still incomplete 2 days later (i.e. the edit window closes), the challenge automatically resets to Day 1. This is the enforcement mechanism — users get a 2-day buffer to retroactively log, then it's final. |
| F-8 | Track number of challenge restarts | | todo | Store a `restartCount` on the challenge record. Increment on every reset (whether auto-reset from missed hard task or manual restart). Persist across the lifetime of the user's account, not just the current attempt. |
| F-9 | Track longest streak (all-time personal best) | | todo | Store `longestStreak` on the user/challenge record. Update whenever the current streak surpasses the previous best. Never resets — this is a lifetime stat. |
| F-10 | Progress page — show restart history with intuitive UI | | todo | The progress map/timeline should visually show where restarts happened (e.g. a break/crack in the timeline, a "restarted" marker). Show total restart count prominently. Could use a "journey so far" visualization that includes failed attempts as part of the story, not as shame. |

---

## Custom Habits

| # | Item | Priority | Status | Notes |
|---|------|----------|--------|-------|
| H-1 | Custom habit creation UI | | todo | Let users add their own habits with name, description, and tracking type (boolean/quantity/duration). |
| H-2 | Hard vs soft rule system | | todo | Users can toggle any habit between "hard" (miss = reset) and "soft" (miss = marked incomplete, day continues). |
| H-3 | Challenge templates | | todo | Prebuilt templates: "75 Hard" (strict), "75 Medium" (softer defaults), "Custom" (blank slate). |
| H-4 | Habit parameter configuration | | todo | Set targets (128 oz, 10 pages, 45 min), units, and frequency for each habit. |
| H-5 | Remove / reorder default habits | | todo | Let users remove or reorder the standard 75 HARD tasks for modified challenges. |

---

## Social & Friends

| # | Item | Priority | Status | Notes |
|---|------|----------|--------|-------|
| S-1 | Friend system — add friends by username, email, or phone number | | todo | Quick-add flow: search by username, email, or phone. Send friend request. Must tie into whatever identity users signed up with. |
| S-2 | Friend requests — accept / decline / block | | todo | Mutual friendship model. Both parties must accept. |
| S-3 | Activity feed (real-time) | | todo | Show friend activity via Convex subscriptions. Types: day_completed, challenge_started, challenge_completed, milestone. |
| S-4 | Milestone celebrations | | todo | Celebrate Day 7, 14, 21, 30, 45, 60, 75 with special UI (confetti, badge, notification to friends). |
| S-5 | Shared challenge groups | | todo | Create a group with friends doing the same challenge. Group progress view. |

---

## Health Device Integration

| # | Item | Priority | Status | Notes |
|---|------|----------|--------|-------|
| I-1 | Apple HealthKit integration | | todo | Import workouts from HealthKit via react-native-health. Normalize to internal schema. |
| I-2 | Oura Ring API integration | | todo | OAuth + REST API. Import sleep, readiness, activity data. |
| I-3 | WHOOP API integration | | todo | OAuth + REST API. Import strain, recovery, workout data. |
| I-4 | Auto-import workouts with duplicate detection | | todo | Check externalId before importing. Allow manual workouts alongside device imports. |

---

## Gamification

| # | Item | Priority | Status | Notes |
|---|------|----------|--------|-------|
| G-1 | XP system for completing daily tasks | | todo | Earn XP per habit completed. Bonus XP for completing all habits in a day. XP resets on challenge reset. |
| G-2 | Level progression with visual level bar | | todo | Level thresholds tied to total XP. Fun level names (Rookie, Grinder, Machine, Legend). |
| G-3 | Streak multipliers | | todo | Consecutive days increase the XP multiplier. |
| G-4 | Achievement badges / milestones | | todo | Day milestones, streak achievements, habit-specific badges (Hydration Master, Bookworm), social badges. |
| G-5 | Optional leaderboards (friends only) | | todo | Opt-in only. No public leaderboards by default. Friends-only comparison. |

---

## Data & Privacy

| # | Item | Priority | Status | Notes |
|---|------|----------|--------|-------|
| P-1 | CSV/JSON data export | | todo | One-click export of all user data from settings. Human-readable format. |
| P-2 | Account deletion flow | | todo | "Delete my account and all data" in settings. Cascade delete across all tables + file storage. Confirmation email on completion. |
| P-3 | Plain-english privacy policy page | | todo | No legalese. Clearly explain what we store, what we don't, and what we'll never do. |
| P-4 | Data portability documentation | | todo | Include schema docs with exports so users can understand and reuse their data. |

---

## Open Source & Repo

| # | Item | Priority | Status | Notes |
|---|------|----------|--------|-------|
| O-1 | Add MIT LICENSE file | | todo | |
| O-2 | Write CONTRIBUTING.md | | todo | Fork → Branch → PR workflow. Lint + typecheck required. Screenshots for UI changes. |
| O-3 | Write CODE_OF_CONDUCT.md | | todo | |
| O-4 | Create GitHub issue templates | | todo | Bug report, feature request, design proposal templates. |
| O-5 | Create PR template | | todo | |
| O-6 | Public GitHub project board for roadmap | | todo | Mirror this backlog as a GitHub Projects board. |

---

## Polish & Scale

| # | Item | Priority | Status | Notes |
|---|------|----------|--------|-------|
| X-1 | React Native mobile app (Expo) | | todo | Shared logic with web. Native feel. |
| X-2 | Push notifications (opt-in only) | | todo | Daily reminders, friend activity, milestone alerts. User controls what they receive. |
| X-3 | Offline support | | todo | Cache today's tasks. Sync when back online. |
| X-4 | Performance optimization | | todo | Lighthouse audit, bundle analysis, image optimization. |
| X-5 | Accessibility audit (WCAG 2.1 AA) | | todo | Full audit and remediation. |
| X-6 | Pricing implementation (if needed) | | todo | Stripe integration for optional $1/month contribution or commitment fee. Decision pending. |

---

## Completed

| # | Item | Date |
|---|------|------|
| ~~L-1~~ | Landing page design (v14 Tropical Zine) | 2026-02-11 |
| ~~L-2~~ | Cloudflare Workers deployment | 2026-02-11 |
| ~~L-3~~ | Product plan document | 2026-02-11 |

---

*Add new items to the relevant section. Update priorities and status as work progresses.*
