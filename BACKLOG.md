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
| A-4 | Onboarding questionnaire — age, health & goals | P1 | todo | After sign-up, walk users through a short questionnaire: age range, health conditions/limitations (optional), and what they hope to get out of the challenge (weight loss, discipline, mental toughness, etc.). Use answers to recommend a default setup tier (Original / Customized / Added) and suggest soft rules where appropriate (e.g., older users or those with injuries get outdoor-workout marked soft by default). Include a caring health advisory with optional "I've reviewed this with my doctor" acknowledgment. Store all answers on the user record in Convex. |
| A-5 | Onboarding — habit setup flow (3 tiers) | P1 | todo | After the questionnaire, present three setup paths: **Original** — the standard 8 daily tasks, all marked hard by default. **Customized** — start with the default 8, toggle off any tasks the user doesn't want (remove only, no adding). **Added** — fully custom: user creates their own tasks, choosing between two block types: *Task* (simple done/not-done checkbox, e.g., workout, photo, diet) and *Counter* (incremental quantity toward a goal, e.g., 128 oz water, 10 pages). Each task gets a name, an optional target (for Counter type), and a hard/soft toggle. Pre-recommend a tier based on questionnaire answers but let the user override freely. |
| A-6 | Onboarding — hard/soft rule defaults + later editing | P1 | todo | During onboarding setup, each task shows a hard/soft toggle. Defaults: Original tier = all hard; Customized/Added = user picks per task. Hard = miss resets challenge to Day 0. Soft = miss is logged as incomplete but the challenge continues. After onboarding, users can change any task's hard/soft setting anytime from Settings. |
| A-7 | Onboarding — save & create challenge | P1 | todo | Final step: "Start Your Challenge" button. On tap, save all onboarding data to Convex in one transaction: user profile (age, health, goals), challenge record, and task definitions (name, block type, target, hard/soft). Redirect to the dashboard with their personalized setup ready. |

---

## Core Features — Foundation

| # | Item | Priority | Status | Notes |
|---|------|----------|--------|-------|
| F-1 | ~~Basic dashboard UI~~ | | done | 4 themed dashboards (Arctic, Broadsheet, Military, Zen) with day counter, progress bar, stats. |
| F-2 | ~~Daily check-in card~~ | | done | DailyChecklist component with 3 categories, tap-to-complete, workout logging, photo upload, confetti. |
| F-3 | ~~Standard 75 HARD habit tracking~~ | | done | Day advancement logic, reset-on-miss rule, and full 6-task tracking all implemented. Completed 2026-02-12. |
| F-4 | ~~Progress photo upload — thumbnail generation & gallery lightbox~~ | | done | Thumbnails generated client-side (400px, 70% JPEG). Gallery lightbox with arrow/swipe/keyboard navigation, directional slide animations, adjacent image preloading, photo counter. Completed 2026-02-13. |
| F-5 | ~~Swipe through previous days — view any past day's log~~ | | done | SwipeableDayView component with touch swipe + keyboard arrows. Read-only for days older than 2 days. Completed 2026-02-13. |
| F-6 | ~~Edit past 2 days of logs~~ | | done | 2-day edit window implemented — users can edit today and previous 2 days, older days are locked. Completed 2026-02-12. |
| F-7 | ~~Auto-reset on missed hard task after 2-day grace window~~ | | done | Auto-reset implemented — if hard-rule tasks are incomplete after 2-day grace window, challenge resets to Day 1. Completed 2026-02-12. |
| F-8 | ~~Track number of challenge restarts~~ | | done | `lifetimeRestartCount` on users table, incremented in `failChallengeInternal`. Shown as "Attempt #N" on Progress page and in ChallengeFailedDialog. Completed 2026-02-12. |
| F-9 | ~~Track longest streak (all-time personal best)~~ | | done | `longestStreak` on users table, updated on failure and completion paths. Shown as "Best Streak" on Progress page. `getLifetimeStats` query computes currentStreak on-read. Completed 2026-02-12. |
| F-10 | Progress page — show restart history with intuitive UI | P2 | todo | The progress map/timeline should visually show where restarts happened (e.g. a break/crack in the timeline, a "restarted" marker). Show total restart count prominently. Could use a "journey so far" visualization that includes failed attempts as part of the story, not as shame. |

---

## Custom Habits

> Core habit setup now lives in the onboarding flow (A-5, A-6). Items below cover post-onboarding management and future enhancements.

| # | Item | Priority | Status | Notes |
|---|------|----------|--------|-------|
| H-1 | Two block types — Task & Counter | P1 | todo | Implement the two fundamental block types used across the app. **Task**: simple done/not-done checkbox (e.g., workout, progress photo, follow diet). **Counter**: incremental quantity toward a configurable goal (e.g., 128 oz water, 10 pages read). Both types support hard/soft rules. Schema: `{ name, blockType: 'task' | 'counter', target?: number, unit?: string, isHard: boolean }`. |
| H-2 | Edit habits post-onboarding | P2 | todo | Settings page section to add, remove, rename, or reconfigure habits after initial setup. Change block type, target, hard/soft. Cannot edit while a day is in progress (changes apply next day). |
| H-3 | LLM-assisted habit creation (future) | P4 | todo | In the Added tier, let users describe what they want to track in free-text (paragraph or bullet points). Validate the input is about habits/tasks, then send to an LLM that returns structured task definitions (`name`, `blockType`, `target`, `isHard`). User reviews and confirms before saving. Deferred — start with manual Task/Counter creation, revisit when usage data shows demand. |
| H-4 | Challenge templates library | P3 | todo | Pre-built templates beyond "Original 75 HARD": e.g., "75 Medium" (all soft rules), "Fitness Focus" (3 workouts, no reading), "Mindfulness" (meditation + journaling + reading). Templates are starting points — users can customize after selecting. |

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
| P-5 | Integrate PostHog for analytics | P2 | todo | Add PostHog SDK (`posthog-js` + `posthog-node`) for privacy-friendly product analytics. Track key events (sign-up, challenge start/restart/complete, day completion, theme switch). Respect Do Not Track. Configure EU hosting or self-host if needed to align with privacy-first stance. |

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
| SEO-8 | ~~LLM & AI search optimization (LLMO)~~ | | done | Added `public/llms.txt` (plain-text site summary for LLM crawlers), 8-question FAQ accordion on landing page with native `<details>/<summary>`, and `FAQPage` JSON-LD structured data in layout.tsx `@graph`. Completed 2026-02-13. |
| SEO-9 | Performance & Core Web Vitals | P2 | todo | Audit LCP, FID, CLS on the homepage. Optimize images (WebP/AVIF, proper sizing), defer non-critical JS, ensure fonts don't cause layout shift. Good CWV directly impacts search ranking. |
| SEO-10 | Create `/about` page for discoverability | P2 | todo | A public, crawlable page explaining 75 Proof, the 75 HARD challenge, the team, and the open-source mission. Rich keyword content for both traditional search and LLM retrieval. |
| SEO-11 | Social sharing preview for user milestones | P3 | todo | When users share milestones (Day 30, Day 75, etc.), generate dynamic OG images with their stats. Use Next.js `ImageResponse` (og) API or a Cloudflare Worker for on-the-fly image generation. |

---

## Remotion — Video & Animation

### Landing Page Showcase Videos

Embed short, looping Remotion videos on the landing page to showcase the app's UI in an engaging, interactive way. Each video should be rendered as an MP4/WebM (or use `@remotion/player` for inline playback) and placed in a relevant landing page section.

| # | Item | Priority | Status | Notes |
|---|------|----------|--------|-------|
| R-1 | "A Day in 75 Proof" hero animation | P2 | todo | **Concept:** Animate the DailyChecklist being completed task-by-task — check off a morning outdoor workout (form slides in, tap complete), tap water glasses one by one filling a row of 8, mark reading blocks, upload a progress photo (thumbnail appears), then confetti explosion on day completion. **Placement:** Hero section or "The Daily Six" section of the landing page. Loops seamlessly. |
| R-1a | ↳ Design & storyboard the hero animation | P2 | todo | Sketch frame-by-frame storyboard. Decide timing per task (e.g., 2s per check, 1s confetti). Pick which theme to use (or cycle themes). Define resolution, aspect ratio, loop point. Figma or rough sketches OK. |
| R-1b | ↳ Implement Remotion composition for hero animation | P2 | todo | Build the Remotion `<Composition>` with sequences for each checklist task. Use `interpolate`, `spring`, and `Sequence` for timing. Match actual component styles (Tailwind classes → inline styles or CSS modules for Remotion). Render to MP4/WebM or use `@remotion/player`. |
| R-1c | ↳ Integrate hero animation into landing page | P2 | todo | Embed the rendered video or `<Player>` component in the landing page hero/Daily Six section. Lazy load, autoplay muted, loop. Responsive sizing. Fallback static image for slow connections. |
| R-2 | Theme carousel showcase | P2 | todo | **Concept:** Smoothly morph between the 4 themed dashboards (Arctic → Broadsheet → Military → Zen) showing Day 23 with ~60% completion in each aesthetic. Each theme holds for 3-4s, transitions with a crossfade or slide. **Placement:** New "Pick Your Vibe" section on landing page, or alongside "Why 75 Proof" cards. |
| R-2a | ↳ Design theme transitions & section layout | P2 | todo | Decide transition style (crossfade, slide, morph). Mock up the landing page section where this lives. Determine which dashboard elements to show (progress ring, checklist snippet, day header). Define mobile vs desktop crop. |
| R-2b | ↳ Implement Remotion composition for theme carousel | P2 | todo | Recreate a simplified dashboard view for each theme inside Remotion. Sequence with transitions between them. Match actual theme colors and typography exactly. |
| R-2c | ↳ Integrate theme carousel into landing page | P2 | todo | Add new section to `app/page.tsx`. Embed video/player. Responsive. Lazy load. |
| R-3 | 75-day progress timelapse | P3 | todo | **Concept:** Fast-forward through 75 days — calendar grid squares filling in green one-by-one, stats counters incrementing (workouts, water gallons, pages read), progress photo thumbnails appearing in a grid, streak flame growing. Ends with a "Day 75 — Challenge Complete" celebration. **Placement:** Above the final CTA section ("Stop overthinking it"). |
| R-3a | ↳ Design timelapse storyboard & data script | P3 | todo | Define the 75-day data (which days complete, a few incomplete for realism). Map out visual beats: calendar fill, stat counters, photo grid, final celebration. Decide pacing — likely 15-20s total. |
| R-3b | ↳ Implement Remotion composition for timelapse | P3 | todo | Build calendar grid, animated counters (`interpolate` on numbers), photo grid reveal, and final celebration sequence. Use `spring` for satisfying number rolls. |
| R-3c | ↳ Integrate timelapse into landing page | P3 | todo | Embed above CTA section. Autoplay when scrolled into view (Intersection Observer). |
| R-4 | Swipe day navigation demo | P3 | todo | **Concept:** Show the swipe gesture flipping through days like a card stack — Day 12 (all green ✓), Day 13 (5/6 done), Day 14 (current, tasks checking off). Demonstrates the SwipeableDayView UX. **Placement:** Alongside or below "The Daily Six" section. |
| R-4a | ↳ Design swipe animation storyboard | P3 | todo | Sketch the card-swipe motion. Decide how many days to show (3-5). Define which tasks are complete/incomplete per day. Mobile-style framing (phone mockup?). |
| R-4b | ↳ Implement Remotion composition for swipe demo | P3 | todo | Animate card transitions with `spring` physics. Show simplified checklist states per day. Optional: wrap in a phone frame graphic. |
| R-4c | ↳ Integrate swipe demo into landing page | P3 | todo | Embed in relevant section. Responsive. Lazy load. |

### Post-Onboarding Usage Tutorial

A Remotion-powered animated walkthrough that plays after a new user completes onboarding, teaching them the core daily loop before they land on their first dashboard.

| # | Item | Priority | Status | Notes |
|---|------|----------|--------|-------|
| R-5 | Post-onboarding animated usage tutorial | P1 | todo | **Concept:** After onboarding (A-7), before redirecting to dashboard, show a short animated tutorial (30-45s) walking the user through their first day. Uses their actual theme choice and habits from onboarding. Skippable. Plays once (flag stored on user record). |
| R-5a | ↳ Define tutorial scenes & script | P1 | todo | Plan 4-6 tutorial scenes: (1) "Here's your dashboard" — pan of the themed dashboard with day counter. (2) "Check off your first workout" — tap a workout, form slides in, complete it. (3) "Track your water" — tap glasses one by one. (4) "Log your reading" — tap reading blocks. (5) "Take your progress photo" — camera icon tap, thumbnail appears. (6) "Swipe to see past days" — swipe gesture demo. Each scene: 5-7s with text overlay caption. |
| R-5b | ↳ Design tutorial UI & overlay style | P1 | todo | Design the tutorial player UI: skip button, progress dots, text caption overlay style, transition between scenes. Should feel native to the app, not a separate modal. Consider a spotlight/highlight effect pointing to the relevant area of the UI being explained. |
| R-5c | ↳ Implement Remotion compositions for tutorial scenes | P1 | todo | Build each scene as a Remotion `<Sequence>`. Recreate simplified versions of the themed dashboard and checklist components. Animate interactions (taps, swipes, form entries) with `spring` and `interpolate`. Text captions fade in/out per scene. |
| R-5d | ↳ Build tutorial player & routing logic | P1 | todo | Create a `/dashboard/tutorial` route or full-screen overlay. Use `@remotion/player` for inline playback with play/pause/skip controls. On completion or skip, redirect to dashboard. Store `hasSeenTutorial: true` on user record in Convex. Only show once per user. |
| R-5e | ↳ Connect tutorial to onboarding flow | P1 | todo | After A-7 (save & create challenge), route to tutorial instead of dashboard. Pass theme and habit config so the tutorial reflects the user's actual setup. Handle edge case: user refreshes mid-tutorial. |

### Remotion Infrastructure

| # | Item | Priority | Status | Notes |
|---|------|----------|--------|-------|
| R-6 | Set up Remotion in the project | P1 | todo | Install `remotion`, `@remotion/cli`, `@remotion/player`, `@remotion/bundler`. Create `remotion/` directory at project root with `Root.tsx` and composition registry. Configure `remotion.config.ts`. Add `pnpm remotion:studio` and `pnpm remotion:render` scripts. Ensure it coexists with the Next.js build without conflicts. |
| R-7 | Remotion render pipeline for landing page videos | P2 | todo | Decide render strategy: (a) pre-render to MP4/WebM at build time and serve as static assets, or (b) use `@remotion/player` for client-side playback. Pre-rendered is better for landing page (no JS overhead). Set up a render script that outputs to `public/videos/`. Add to CI if needed. |

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
| ~~SEO-8~~ | LLM & AI search optimization — llms.txt, FAQ section, FAQPage JSON-LD | 2026-02-13 |
| ~~F-4~~ | Progress photo thumbnails & gallery lightbox (nav, swipe, preload) | 2026-02-13 |
| ~~F-5~~ | Swipe through previous days (SwipeableDayView) | 2026-02-13 |

---

*Add new items to the relevant section. Update priorities and status as work progresses.*
