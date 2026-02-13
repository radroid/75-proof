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
| B-1 | ~~Mobile sidebar is non-functional~~ — replaced with Glass Pill bottom nav | | done | Replaced sidebar with mobile bottom nav component (`mobile-bottom-nav.tsx`). |
| B-2 | Overscroll background color mismatch on non-homepage routes | | done | Fixed for homepage. Verify other routes match their backgrounds. |

---

## UX / Design Improvements

| # | Item | Priority | Status | Notes |
|---|------|----------|--------|-------|
| D-1 | ~~Today page — remove redundant metrics~~ | | done | Removed streak, days done, remaining days from all 4 themed dashboards. |
| D-2 | ~~Today page — remove task category fractions~~ | | done | Removed completedCount/totalCount from category headers. |
| D-3 | ~~Today page — reduce overall text density~~ | | done | Removed "tap to complete/undo" hints, tightened detail copy, hid detail text when done. |
| D-4 | ~~Today page — clear visual feedback~~ | | done | Added strikethrough + opacity on done items, green accent bar + success checkmark, hide children when done. |
| D-5 | ~~Water intake tracker — simplify to checklist~~ | | done | Replaced with 8-glass checklist (8 × 16oz = 128oz), tap to check/uncheck. |
| D-6 | Task detail — support photo upload on all tasks | P2 | todo | "Add details" for each task should allow attaching a photo. |
| D-7 | Progress photo task — open camera directly on mobile | P2 | todo | On Android/iOS, tapping the progress photo task should open the native camera, not the photo gallery. |
| D-8 | ~~Progress page — design polish~~ | | done | Removed Card/Section/PageHeader wrappers; inline font-heading titles, small-caps section labels, thin dividers, borderless timeline rows, theme-aligned spacing (mb-16/my-16/mb-8). Completed 2026-02-12. |
| D-9 | ~~Landing page — ensure all mobile breakpoints are polished~~ | | done | Tightened base Tailwind values for 320px–428px: scaled headings, reduced padding/spacing, full-width CTA buttons, iOS safe-area footer, justified newspaper text, button cursor:pointer, newspaper hover effect. Completed 2026-02-13. |
| D-10 | ~~Clerk components — theme-aware styling~~ | | done | Consolidated hardcoded Clerk appearance configs into shared `lib/clerk-appearance.ts` using CSS variables. ClerkProvider, UserButton popovers, and UserProfile modals now follow the active theme (arctic, broadsheet, military, zen). Removed duplicated config from 4 files. Completed 2026-02-13. |

---

## Onboarding & Auth

| # | Item | Priority | Status | Notes |
|---|------|----------|--------|-------|
| A-1 | ~~Browse-first experience — let new users view the full UI without signing up~~ | | done | Interactive demo dashboard with guest mode. Users can explore dashboard, Today page, and progress page without signing up. Persistent "Sign up to save your progress" prompt. Completed 2026-02-12. |
| A-2 | ~~One-click sign up process~~ | | done | Modal sign-up with social buttons top, branded Clerk theming, mobile-optimized touch targets. Implemented 2026-02-12. |
| A-3 | ~~Core authentication flow (Clerk integration)~~ | | done | Clerk fully integrated: sign-up, sign-in, sign-out, session management, middleware protection. |
| A-4 | Health advisory during onboarding | P2 | todo | Show a caring, well-designed health warning screen. Non-blocking but informative. Include "I've reviewed this with my doctor" optional acknowledgment. |

---

## Core Features — Foundation

| # | Item | Priority | Status | Notes |
|---|------|----------|--------|-------|
| F-1 | ~~Basic dashboard UI~~ | | done | 4 themed dashboards (Arctic, Broadsheet, Military, Zen) with day counter, progress bar, stats. |
| F-2 | ~~Daily check-in card~~ | | done | DailyChecklist component with 3 categories, tap-to-complete, workout logging, photo upload, confetti. |
| F-3 | ~~Standard 75 HARD habit tracking~~ | | done | Day advancement logic, reset-on-miss rule, and full 6-task tracking all implemented. Completed 2026-02-12. |
| F-4 | Progress photo upload — thumbnail generation | P1 | todo | Upload works (PhotoRow). Still need: generate thumbnails for feed display, gallery view of past photos. |
| F-5 | Swipe through previous days — view any past day's log | P1 | todo | User can slide/swipe back to view any previous day's tasks and completion status. Read-only for days older than 2 days. |
| F-6 | ~~Edit past 2 days of logs~~ | | done | 2-day edit window implemented — users can edit today and previous 2 days, older days are locked. Completed 2026-02-12. |
| F-7 | ~~Auto-reset on missed hard task after 2-day grace window~~ | | done | Auto-reset implemented — if hard-rule tasks are incomplete after 2-day grace window, challenge resets to Day 1. Completed 2026-02-12. |
| F-8 | ~~Track number of challenge restarts~~ | | done | `lifetimeRestartCount` on users table, incremented in `failChallengeInternal`. Shown as "Attempt #N" on Progress page and in ChallengeFailedDialog. Completed 2026-02-12. |
| F-9 | ~~Track longest streak (all-time personal best)~~ | | done | `longestStreak` on users table, updated on failure and completion paths. Shown as "Best Streak" on Progress page. `getLifetimeStats` query computes currentStreak on-read. Completed 2026-02-12. |
| F-10 | Progress page — show restart history with intuitive UI | P2 | todo | The progress map/timeline should visually show where restarts happened (e.g. a break/crack in the timeline, a "restarted" marker). Show total restart count prominently. Could use a "journey so far" visualization that includes failed attempts as part of the story, not as shame. |

---

## Custom Habits

| # | Item | Priority | Status | Notes |
|---|------|----------|--------|-------|
| H-1 | Custom habit creation UI | P2 | todo | Let users add their own habits with name, description, and tracking type (boolean/quantity/duration). |
| H-2 | Hard vs soft rule system | P2 | todo | Users can toggle any habit between "hard" (miss = reset) and "soft" (miss = marked incomplete, day continues). |
| H-3 | Challenge templates | P3 | todo | Prebuilt templates: "75 Hard" (strict), "75 Medium" (softer defaults), "Custom" (blank slate). |
| H-4 | Habit parameter configuration | P3 | todo | Set targets (128 oz, 10 pages, 45 min), units, and frequency for each habit. |
| H-5 | Remove / reorder default habits | P3 | todo | Let users remove or reorder the standard 75 HARD tasks for modified challenges. |

---

## Social & Friends

| # | Item | Priority | Status | Notes |
|---|------|----------|--------|-------|
| S-1 | Friend system — add friends by username, email, or phone number | P2 | todo | Quick-add flow: search by username, email, or phone. Send friend request. Must tie into whatever identity users signed up with. |
| S-2 | Friend requests — accept / decline / block | P2 | todo | Mutual friendship model. Both parties must accept. |
| S-3 | Activity feed (real-time) | P3 | todo | Show friend activity via Convex subscriptions. Types: day_completed, challenge_started, challenge_completed, milestone. |
| S-4 | Milestone celebrations | P3 | todo | Celebrate Day 7, 14, 21, 30, 45, 60, 75 with special UI (confetti, badge, notification to friends). |
| S-5 | Shared challenge groups | P4 | todo | Create a group with friends doing the same challenge. Group progress view. |

---

## Health Device Integration

| # | Item | Priority | Status | Notes |
|---|------|----------|--------|-------|
| I-1 | Apple HealthKit integration | P4 | todo | Import workouts from HealthKit via react-native-health. Normalize to internal schema. Requires mobile app (X-1). |
| I-2 | Oura Ring API integration | P4 | todo | OAuth + REST API. Import sleep, readiness, activity data. |
| I-3 | WHOOP API integration | P4 | todo | OAuth + REST API. Import strain, recovery, workout data. |
| I-4 | Auto-import workouts with duplicate detection | P4 | todo | Check externalId before importing. Allow manual workouts alongside device imports. |

---

## Gamification

| # | Item | Priority | Status | Notes |
|---|------|----------|--------|-------|
| G-1 | XP system for completing daily tasks | P3 | todo | Earn XP per habit completed. Bonus XP for completing all habits in a day. XP resets on challenge reset. |
| G-2 | Level progression with visual level bar | P3 | todo | Level thresholds tied to total XP. Fun level names (Rookie, Grinder, Machine, Legend). |
| G-3 | Streak multipliers | P3 | todo | Consecutive days increase the XP multiplier. |
| G-4 | Achievement badges / milestones | P3 | todo | Day milestones, streak achievements, habit-specific badges (Hydration Master, Bookworm), social badges. |
| G-5 | Optional leaderboards (friends only) | P4 | todo | Opt-in only. No public leaderboards by default. Friends-only comparison. |

---

## Data & Privacy

| # | Item | Priority | Status | Notes |
|---|------|----------|--------|-------|
| P-1 | CSV/JSON data export | P3 | todo | One-click export of all user data from settings. Human-readable format. |
| P-2 | Account deletion flow | P2 | todo | "Delete my account and all data" in settings. Cascade delete across all tables + file storage. Confirmation email on completion. |
| P-3 | Plain-english privacy policy page | P2 | todo | No legalese. Clearly explain what we store, what we don't, and what we'll never do. |
| P-4 | Data portability documentation | P3 | todo | Include schema docs with exports so users can understand and reuse their data. |

---

## Open Source & Repo

| # | Item | Priority | Status | Notes |
|---|------|----------|--------|-------|
| O-1 | ~~Add MIT LICENSE file~~ | | done | Added MIT LICENSE to project root. |
| O-2 | Write CONTRIBUTING.md | P2 | todo | Fork → Branch → PR workflow. Lint + typecheck required. Screenshots for UI changes. |
| O-3 | Write CODE_OF_CONDUCT.md | P3 | todo | |
| O-4 | Create GitHub issue templates | P3 | todo | Bug report, feature request, design proposal templates. |
| O-5 | Create PR template | P3 | todo | |
| O-6 | Public GitHub project board for roadmap | P3 | todo | Mirror this backlog as a GitHub Projects board. |

---

## SEO & Online Presence

| # | Item | Priority | Status | Notes |
|---|------|----------|--------|-------|
| SEO-1 | ~~Meta tags & Open Graph setup~~ | | done | OG tags added to layout.tsx with dynamic OG image generation via `opengraph-image.tsx`. Completed 2026-02-12. |
| SEO-2 | ~~Twitter/X meta tags & card preview~~ | | done | Twitter card meta tags (large image summary) added to layout.tsx metadata. Completed 2026-02-12. |
| SEO-3 | ~~Structured data (JSON-LD)~~ | | done | `SoftwareApplication` JSON-LD schema markup added to homepage. Completed 2026-02-12. |
| SEO-4 | ~~Sitemap & robots.txt~~ | | done | `sitemap.xml` via `app/sitemap.ts` and `robots.txt` via `app/robots.ts`. Dashboard/auth routes excluded. Completed 2026-02-12. |
| SEO-5 | Canonical URLs & trailing slash normalization | P2 | todo | Set canonical `<link>` tags on all pages. Configure `next.config.js` `trailingSlash` consistently. Prevent duplicate content from `www` vs non-`www`, trailing slashes, etc. |
| SEO-6 | LinkedIn meta tags & company page setup | P2 | todo | Ensure OG tags work for LinkedIn sharing (LinkedIn uses OG). Create a LinkedIn company page for 75 Proof with logo, description, and link to the app. |
| SEO-7 | Meta (Facebook/Instagram) Open Graph optimization | P2 | todo | Verify OG tags render correctly in Facebook Sharing Debugger. Add `fb:app_id` if a Facebook app is created. Consider an Instagram presence linking back to the app. |
| SEO-8 | LLM & AI search optimization (LLMO) | P1 | todo | Add a `/llms.txt` file (plain-text site summary for LLM crawlers). Include clear, factual descriptions of what 75 Proof is, what it does, who it's for, and how it's different. Add FAQ-style content to the homepage or a `/about` page that LLMs can extract structured answers from (e.g., "What is 75 HARD?", "Is 75 Proof free?", "How does 75 Proof track workouts?"). |
| SEO-9 | Performance & Core Web Vitals | P2 | todo | Audit LCP, FID, CLS on the homepage. Optimize images (WebP/AVIF, proper sizing), defer non-critical JS, ensure fonts don't cause layout shift. Good CWV directly impacts search ranking. |
| SEO-10 | Create `/about` page for discoverability | P2 | todo | A public, crawlable page explaining 75 Proof, the 75 HARD challenge, the team, and the open-source mission. Rich keyword content for both traditional search and LLM retrieval. |
| SEO-11 | Social sharing preview for user milestones | P3 | todo | When users share milestones (Day 30, Day 75, etc.), generate dynamic OG images with their stats. Use Next.js `ImageResponse` (og) API or a Cloudflare Worker for on-the-fly image generation. |

---

## Polish & Scale

| # | Item | Priority | Status | Notes |
|---|------|----------|--------|-------|
| X-1 | React Native mobile app (Expo) | P4 | todo | Shared logic with web. Native feel. |
| X-2 | Push notifications (opt-in only) | P4 | todo | Daily reminders, friend activity, milestone alerts. User controls what they receive. |
| X-3 | Offline support | P4 | todo | Cache today's tasks. Sync when back online. |
| X-4 | Performance optimization | P3 | todo | Lighthouse audit, bundle analysis, image optimization. |
| X-5 | Accessibility audit (WCAG 2.1 AA) | P3 | todo | Full audit and remediation. |
| X-6 | Pricing implementation (if needed) | P4 | todo | Stripe integration for optional $1/month contribution or commitment fee. Decision pending. |
| X-7 | Theme-aware skeleton loading screens | P3 | todo | Add skeleton loading animations that match each theme (Arctic, Broadsheet, Military, Zen). Show styled placeholders for the hero section, stats, and checklist while Convex data loads. Smoother perceived performance. |
| X-8 | ~~Make the app a PWA~~ | | done | Manifest, programmatic icons (192/512/apple-touch), hand-written service worker (cache-first static, network-first navigation, offline fallback), branded offline page, SW registration. No new deps. Completed 2026-02-12. |

---

## Completed

| # | Item | Date |
|---|------|------|
| ~~L-1~~ | Landing page design (v14 Tropical Zine) | 2026-02-11 |
| ~~L-2~~ | Cloudflare Workers deployment | 2026-02-11 |
| ~~L-3~~ | Product plan document | 2026-02-11 |
| ~~B-1~~ | Mobile Glass Pill bottom nav | 2026-02-11 |
| ~~A-3~~ | Core authentication flow (Clerk) | 2026-02-11 |
| ~~F-1~~ | Basic dashboard UI (4 themed dashboards) | 2026-02-11 |
| ~~F-2~~ | Daily check-in card (DailyChecklist) | 2026-02-11 |
| ~~D-1~~ | Remove redundant metrics from Today page | 2026-02-11 |
| ~~D-2~~ | Remove category fractions from checklist | 2026-02-11 |
| ~~D-3~~ | Reduce text density on Today page | 2026-02-11 |
| ~~D-4~~ | Visual feedback for complete/incomplete tasks | 2026-02-11 |
| ~~D-5~~ | Simplify water tracker to 8-glass checklist | 2026-02-11 |
| ~~O-1~~ | MIT LICENSE file | 2026-02-11 |
| ~~A-2~~ | One-click sign up process (modal + branded Clerk theming) | 2026-02-12 |
| ~~F-3~~ | Standard 75 HARD habit tracking (day advancement, 6-task tracking) | 2026-02-12 |
| ~~F-6~~ | Edit past 2 days of logs (2-day edit window) | 2026-02-12 |
| ~~F-7~~ | Auto-reset on missed hard task after 2-day grace window | 2026-02-12 |
| ~~D-8~~ | Progress page design polish (open layout, theme-aligned spacing) | 2026-02-12 |
| ~~SEO-1~~ | Meta tags & Open Graph setup | 2026-02-12 |
| ~~SEO-2~~ | Twitter/X meta tags & card preview | 2026-02-12 |
| ~~SEO-3~~ | Structured data (JSON-LD) | 2026-02-12 |
| ~~SEO-4~~ | Sitemap & robots.txt | 2026-02-12 |
| ~~F-8~~ | Track number of challenge restarts (lifetime) | 2026-02-12 |
| ~~F-9~~ | Track longest streak (all-time personal best) | 2026-02-12 |
| ~~X-8~~ | Make the app a PWA (manifest, icons, service worker, offline page) | 2026-02-12 |
| ~~A-1~~ | Browse-first guest experience with interactive demo dashboard | 2026-02-12 |
| ~~D-10~~ | Clerk components — theme-aware styling (shared `lib/clerk-appearance.ts`) | 2026-02-13 |
| ~~D-9~~ | Landing page mobile breakpoints polish (320px–428px) | 2026-02-13 |

---

*Add new items to the relevant section. Update priorities and status as work progresses.*
