# Earned transition backlog

> The full backlog to take the product from the current multi-theme dashboard to **Earned** as the singular brand identity — a notebook-style habit tracker with paper feel, handwritten moments, gold-star reward.
>
> **Branch:** `ux-refresh-simplified-challenge-driven` (do not merge to `main` until this backlog reaches the rollout phase)
> **Source of truth for design:** `design-system/` (in-repo bundle from Claude Design)
> **Initial scaffold landed:** 2026-05-17

---

## How to use this file

- Tasks are sized **S** (≤ ½ day), **M** (1–2 days), **L** (3–5 days), **XL** (week+).
- Phases run roughly in order; items inside a phase can usually parallelize. Dependencies noted inline as `→ #N` or `→ phase X`.
- Tick `[ ]` → `[x]` as work completes. Move done items to the `## Done` section at the bottom rather than deleting — the trail is useful when someone asks "why is X like this?".
- When you start an item, open a PR off this branch (or a sub-branch). Tag the PR with `area:earned` so the cluster is grepable.
- Items prefixed with **⛳ blocker** must complete before downstream work in their phase can land.

---

## Done — Phase 0 · Scaffold

- [x] Save `design-system/` bundle into repo as living reference
- [x] Copy brand assets to `public/brand/earned/` (logo-mark, logo-wordmark, star.svg)
- [x] Wire Poppins (400/500/600/700) + Caveat (400/500/600/700) via `next/font/google`
- [x] Add `[data-theme="earned"]` block to `app/globals.css` with full token mapping + paper shadow family + ink-sticker shadow
- [x] Add `.paper-ruled` and `.paper-ruled-margin` utilities scoped to `[data-theme="earned"]`
- [x] Register `earned` in `lib/themes.ts` (5th personality) + theme-switcher preview tile
- [x] Build `EarnedDashboard` (Today screen): handwritten header, gold streak chip, sky done chip, hand-drawn habit rows, all-done celebration with 72px gold star
- [x] Wire into `dashboardComponents` map at `app/(dashboard)/dashboard/page.tsx`
- [x] Production build passes (`npx next build`)

---

## Phase 1 — Today screen polish

The shipped EarnedDashboard is a faithful first cut. This phase closes the visible gaps and gives the screen production-quality feel.

- [ ] **[S]** Hand-drawn counter row with incremental logging
  - Tap = increment by sensible unit (water +8oz, reading +5min). Long-press / secondary action = jump to target. Long-press again = clear.
  - Show progress as `value / target unit` in handwritten right column AND a fill state on the checkbox path (e.g. partial-fill animation).
  - Files: `components/themes/earned-dashboard.tsx` (replace binary toggle on counter habits)
- [ ] **[S]** Per-habit streak in guest/local mode → depends on Phase 7 day-completion-map work
- [ ] **[S]** Motion polish — ink stroke draws onto the checkbox path on tap (300ms), then a paper-crinkle 1.0 → 1.02 → 1.0 scale; gold star pop 1.0 → 1.2 → 1.0 with 3-spoke ink burst on full-day completion
- [ ] **[S]** Reduced-motion compliance pass — every animation has a still-photo fallback per CSS `prefers-reduced-motion`
- [ ] **[S]** Loading skeleton refinement — replace the three dashed boxes with handwritten "loading…" with a tiny scribble animation (no spinner — design rule)
- [ ] **[S]** Empty-state polish — when no habits exist, show a handwritten prompt with a "+ add another habit" hand-button matching `screens.jsx` `TodayScreen`
- [ ] **[M]** Accessibility audit on EarnedDashboard
  - Color contrast: ink-on-cream is fine; verify sky-on-cream-light and gold-on-cream-light against WCAG AA (4.5:1 body, 3:1 large)
  - Focus rings visible on hand-drawn checkboxes
  - Screen reader: handwritten font doesn't break SR; verify "Day 12 of 75" reads correctly
  - Keyboard nav order matches visual order
- [ ] **[S]** Confetti color palette — current confetti uses arctic-blue particles; swap to gold + ink + cream for Earned
- [ ] **[S]** Onboarding tour adaptation for Earned — the existing `DashboardTour` references arctic-style elements; either skip it for Earned or rewrite hotspots
- [ ] **[S]** Persist preferred theme to Convex `users.preferences` (currently `localStorage`-only — survives device but not multi-device)

---

## Phase 2 — Surface restyle (Earned theme across the app)

Each surface gets an Earned-paper restyle. Visual fidelity only — no IA change yet.

- [ ] **[L]** `/dashboard/progress` → Earned look
  - Headline metrics → handwritten numbers with cream cards
  - Calendar grid → ruled paper rows, gold star cells for earned, dashed sage for rest, red X for missed
  - Heatmap → ink-density variant (more days completed = darker fill, matching star ledger)
  - Identity card → handwritten prose on cream paper
  - Per-habit list → hand-drawn rows with mini sparkline as a "marker-filled" progress bar
- [ ] **[M]** `/dashboard/settings` → Earned look ("My notebook")
  - Notebook-style settings list (matches `MeScreen` in `design-system/project/ui_kits/earned-ios/screens.jsx`)
  - Each row: handwritten label + value, dashed cream-dark separators
  - Theme switcher card showcasing all 5 themes
- [ ] **[L]** `/dashboard/coach` → Earned look
  - Coach replies render in Caveat for handwritten warmth (or stay in Poppins for legibility — A/B)
  - User bubbles in cream-light, coach bubbles in transparent on ruled paper
  - Composer textarea = handwritten font, sky caret
  - Recent-chats dialog = "previous pages" handwritten title
- [ ] **[M]** `/dashboard/friends` → Earned look
  - Friend cards = sticker-shadow cream chips
  - Activity feed = handwritten timeline ("Sara showed up — Day 14")
  - Nudges = paper-airplane affordance (hand-drawn)
- [ ] **[L]** `/onboarding` flow → Earned look
  - First-person voice throughout ("Today I'm starting…")
  - Hand-drawn checkboxes for choices
  - Paper-page transitions between steps
  - Tone calibration step (warm / playful / calm / tough-love)
- [ ] **[M]** Auth screens (Clerk) → Earned theme appearance config
  - Update `lib/clerk-appearance.ts` to read Earned tokens when theme is earned
  - Sign-in / sign-up forms on cream paper background
- [ ] **[L]** Landing page (`/landing`, `/about`) → Earned brand
  - Replace current arctic-default landing with notebook-style hero
  - Logo wordmark on cream, hand-drawn marketing illustrations
  - "Show up. Every day. Earn the star." (or similar — see Phase 5 voice work)
- [ ] **[S]** Error pages (`/error.tsx`, `/not-found.tsx`, `/offline`) → Earned look — handwritten apology, hand-drawn doodle, paper texture

---

## Phase 3 — New surfaces

Concepts in the design system that don't exist in the app yet.

- [ ] **[XL]** Build `/dashboard/journal` (or `/journal`)
  - Paired-book selection (one book per challenge or rolling)
  - Free-write entry per day on ruled paper with red margin (matches `JournalScreen` in design system)
  - Gold-star sticker top-right showing day earned
  - Margin note doodle (rotated star + "!")
  - Backed by new Convex table `journalEntries: { userId, challengeId, dayNumber, date, content, bookTitle?, bookPage?, createdAt, updatedAt }`
  - History view: scroll back through previous pages
  - Search across entries
  - Export entries to Markdown / PDF
- [ ] **[L]** Build `/dashboard/stars` (renames `/progress` once Phase 4 ships)
  - Big "Stars earned" heading: handwritten total + " of N days"
  - Week-by-week mini-calendar grid (matches `StarsScreen`)
  - Cell states: earned (gold star), missed (red dot), rest (dashed sage z), today (sky filled)
  - "N pages to go" handwritten footer
- [ ] **[M]** "Add a habit" hand-drawn modal — currently lives in onboarding only; promote to a primary action on Today

---

## Phase 4 — Navigation rename + paper bottom nav

Adopt the design's nav vocabulary (Today / Journal / Stars / Me). Sequenced after Phase 2 so the new labels don't point at unstyled surfaces.

- [ ] **[M]** ⛳ blocker — Decide Coach + Friends placement
  - Option A: keep as sibling nav items (6 tabs total) — works on tablet, cramped on phone
  - Option B: collapse into "Me" (Coach + Friends sections inside settings-like surface)
  - Option C: collapse Coach into Journal (chat lives next to written entries) + Friends into Me
  - Option D: sunset Coach until a polished v2; keep Friends as Me child
  - Recommend Option C — Journal becomes the writing+chat surface, Friends moves to Me. Discuss before locking.
- [ ] **[S]** Add Next.js redirects: `/dashboard` → `/dashboard/today`, `/dashboard/progress` → `/dashboard/stars`, `/dashboard/settings` → `/dashboard/me`
  - Or rename routes via folder rename — `app/(dashboard)/dashboard/[old]` → `[new]` — and add 301-style `redirects` in `next.config.ts`
- [ ] **[S]** Rename labels in mobile bottom nav + desktop sidebar
- [ ] **[M]** Build paper-feel bottom nav for Earned theme only
  - Torn-edge top SVG (matches `BottomNav` in `design-system/project/ui_kits/earned-ios/components.jsx`)
  - Active label switches to Caveat handwritten
  - Hand-drawn icon set
  - Coexists with `[data-theme="earned"]` only — other themes keep current nav
- [ ] **[S]** Desktop nav (sidebar / header) — paper strip styling for Earned theme
- [ ] **[S]** Update `app/manifest.ts` (PWA name + nav-link order)
- [ ] **[S]** Update `app/sitemap.ts` and `app/robots.ts` for new route slugs

---

## Phase 5 — Content & voice migration

The design rules are explicit: first-person, sentence-case, no emoji, specific word swaps. This is mostly a copy pass with engineering touchpoints.

- [ ] **[M]** Audit + rewrite all toast strings to first-person voice
  - Currently: "Day complete! 🎉" / "Failed to update"
  - Target: "I showed up." / "That didn't save — try again?"
  - Files: any `toast.success(...)` / `toast.error(...)` call site
- [ ] **[M]** Rewrite dialog copy (failed/completed/reconciliation dialogs) to first-person, no shame
  - "Yesterday slipped by. Today's a fresh page." not "You failed the challenge."
- [ ] **[S]** Vocabulary swap pass — global find-replace using the design system's Use/Avoid table:
  - "Completed" → "Showed up"
  - "Score" → "Streak"
  - "Achievement" → "Star earned"
  - "Today's tasks" → "Today's page"
  - "Failed" → "Skipped"
  - "Goal" → "Habit"
- [ ] **[S]** Strip emoji from all UI strings (audit `components/`, `app/`, `lib/`)
  - Exception: user-entered text in habit names + journal entries (don't strip those)
- [ ] **[S]** Empty/loading/error states audit — every empty state gets a handwritten line in Earned voice
- [ ] **[M]** Onboarding tone calibration — pick from 4 voices at start, store in `users.preferences.tone`
  - Warm: "Today I'm building toward who I want to be."
  - Playful: "Today, a tiny act of greatness."
  - Calm: "Today's small steps."
  - Tough-love: "Today, no excuses."
  - Coach replies + day-complete celebration adapt to the picked tone
- [ ] **[S]** Push notification copy — first-person, no emoji, gentle
  - Morning: "Today's page is ready when you are."
  - Evening: "Showing up tonight?"

---

## Phase 6 — Personalization (deferred from v1)

These were grilled-out in the design discussion but moved out of v1 to keep scope tight.

- [ ] **[L]** Hero-habit picker
  - User-pick: pin one habit as "today's hero" in settings
  - Behavior auto-fallback: if no pin, coach selects based on recency / streak risk / time of day
  - Hero habit renders larger at the top of the list; other habits below in a smaller "and also" section
- [ ] **[L]** Tone-by-pattern coach headline
  - Replace the static "Today I'm showing up for —" sub-prompt with a coach-written daily line
  - Pattern triggers:
    - Logged in early → energizing
    - Missed yesterday → gentle / no-shame
    - Consistent (7+ day streak) → quiet / dignified
    - First day → welcoming
    - Restart → compassionate
  - Generation: short prompt to OpenRouter, cached daily, falls back to template if API fails
- [ ] **[M]** Behavior-detection lib (`lib/coach-behavior-pattern.ts`)
  - Computes a single enum from user's recent activity: `early` | `late` | `consistent` | `missed-yesterday` | `restart` | `first-day` | `final-stretch` | `default`
  - Used by tone-by-pattern, push timing, and future surface decisions

---

## Phase 7 — Cross-cutting engineering

Plumbing work that unblocks polish + other phases.

- [ ] **[S]** Extract shared Earned UI primitives from `components/themes/earned-dashboard.tsx` into `components/earned/` once a second surface needs them: `Star`, `HandCheckbox`, `PaperChip`, `HandHabitRow`, `PageHeader`, `PaperBg`, `HandButton`
- [ ] **[S]** Add `getDayCompletionMap` equivalent to local store (`lib/local-store/hooks.ts`) so per-habit streaks + day-streak work for guests
- [ ] **[S]** Replace the reconstructed `public/brand/earned/star.svg` with the production vector if/when designer provides one. Until then: the current path is hand-traced from the logo PNG.
- [ ] **[M]** Hand-drawn icon set replacing Lucide where it appears in Earned surfaces
  - Inventory: every Lucide icon used in dashboard/coach/progress/friends/settings
  - For each: either draw a hand-stroke version (1.5–2px stroke, round caps/joins, slight rotation) or leave Lucide with a flag in code comments
  - Source: see `design-system/project/README.md` § Iconography
- [ ] **[S]** Replace logo PNG with SVG once designer provides it (current `logo-mark.png` and `logo-wordmark.png` are raster). Until then PNG is fine.
- [ ] **[S]** Add a `paper-texture` opt-in background (faint grain overlay) — store as optional in `users.preferences.paperTexture: boolean`
- [ ] **[S]** PWA: update theme-color meta tag when Earned is active — currently hardcoded `#FF6154` in `app/layout.tsx:87`. Should be `#F4ECD8` for Earned, themed otherwise
- [ ] **[S]** Service worker / install prompt copy → first-person voice
- [ ] **[S]** Open Graph image (`/opengraph-image`) → Earned brand visual (handwritten "earned" wordmark on cream + gold star)

---

## Phase 8 — Analytics + A/B + rollout safety

- [ ] **[S]** PostHog event: `theme_switched { from, to, source }` — track adoption
- [ ] **[S]** PostHog event: `earned_today_loaded` — denominator for engagement metrics
- [ ] **[M]** PostHog feature flag: `earned-theme-default` — when on, new users land in Earned
- [ ] **[L]** A/B experiment: Earned default vs arctic default
  - Hypothesis: Earned drives higher Day 1 → Day 7 retention
  - Cohort: new users only
  - Run length: 4 weeks or 1000 users per arm, whichever later
  - Primary metric: Day-7 retention; secondary: daily check-in rate
- [ ] **[S]** Survey card — after 7 days on Earned, ask: "Notebook feel — keep? swap back?" (1-question, dismissible)
- [ ] **[S]** Funnel: onboarding completion rate by theme — does Earned reduce or increase onboarding drop-off?
- [ ] **[M]** Heuristic completion-rate cohort split by theme over a 30-day window

---

## Phase 9 — Rollout

Sequencing for shipping Earned to production safely.

1. [ ] **[S]** Land Phase 1 polish + Phase 7 plumbing → merge to `main`
2. [ ] **[S]** Enable Earned as a *selectable* theme in production (already shippable today — no flag needed; theme switcher exposes it)
3. [ ] **[M]** Run Phase 8 A/B with Earned as one of 5 selectable themes (no default change)
4. [ ] **[L]** Land Phase 2 surface restyle (each surface = its own PR, merge incrementally)
5. [ ] **[M]** Land Phase 5 content + voice migration
6. [ ] **[S]** Flip default for new users → Earned (`defaultThemeConfig.personality = "earned"` in `lib/themes.ts`)
7. [ ] **[M]** Land Phase 4 nav rename (Today / Journal / Stars / Me)
8. [ ] **[L]** Land Phase 3 new surfaces (Journal especially — its absence is the biggest gap to the design's vision)
9. [ ] **[M]** Land Phase 6 personalization (hero habit + tone-by-pattern)
10. [ ] **[XL]** Sunset window — communicate to users on arctic/broadsheet/military/zen that those themes will be removed; offer 90 days
11. [ ] **[S]** Remove sunsetted themes — delete `arctic-dashboard.tsx`, `broadsheet-dashboard.tsx`, `military-dashboard.tsx`, `zen-dashboard.tsx`, their CSS blocks in `globals.css`, and corresponding `themeMetadata` entries. Migration: existing users on those themes auto-flip to Earned with a one-time toast.

---

## Phase 10 — Documentation + brand discipline

- [ ] **[S]** Update root `README.md` to lead with Earned (current README still describes the pivot as in progress)
- [ ] **[S]** Update `CLAUDE.md` with Earned conventions: voice rules, no-emoji rule, sentence case, Use/Avoid word column, hand-drawn icon discipline
- [ ] **[M]** Create `/design-system` route in the app (dev-only or behind a flag) showing the preview cards from `design-system/project/preview/` — engineers can browse tokens in-app
- [ ] **[S]** Update `app/layout.tsx` metadata: `title`, `description`, OG description in Earned voice
- [ ] **[S]** Convert `design-system/project/SKILL.md` into an installable Claude Code skill so future Earned-design work has the brand guide loaded automatically

---

## Open product questions (resolve before relevant phase)

These don't block scaffold work but will block Phase 4 and beyond. Resolve and record decisions in this doc as they're settled.

1. **Coach + Friends placement** — see Phase 4 blocker. Locking this answer drives nav design.
2. **Counter habit interaction model** — binary tap (current) vs increment-by-unit (Phase 1) vs both via long-press. Pick before Phase 1 counter row work.
3. **Journal scope** — full free-write surface (Phase 3) or strip down to a 1-line daily prompt? The design has the former; the latter is easier to ship.
4. **Tone calibration** — store at user level (one tone per account) or per-challenge (different tone for different routines)?
5. **Sunset timeline** — 90 days seems right for theme sunsetting (Phase 9 step 10); confirm with usage data before committing.
6. **Real brand assets** — when does designer deliver the canonical star SVG + logo SVG? Currently using a hand-reconstructed star and PNG logos.
7. **Multi-language** — design system is English-only. When does the product need i18n, and does Caveat support every script we'll add?

---

## Effort summary (rough order-of-magnitude)

| Phase | Count | Aggregate effort |
|-------|-------|------------------|
| 1 — Polish | 9 | ~M |
| 2 — Restyle | 8 | ~XL |
| 3 — New surfaces | 3 | ~XL |
| 4 — Nav rename | 8 | ~L |
| 5 — Voice migration | 6 | ~L |
| 6 — Personalization | 3 | ~L |
| 7 — Plumbing | 8 | ~M |
| 8 — Analytics/A-B | 6 | ~M |
| 9 — Rollout | 11 | spread across other phases |
| 10 — Docs | 5 | ~S |

**Total realistic timeline:** 8–12 weeks of focused product+eng work, assuming one full-time dev with design support. Can compress to 4–6 weeks with two devs paralleling Phase 2 + Phase 3.

---

## Decisions log (append-only)

> Record material design / scope decisions here as they're made, with date and one-line rationale. Future-you and future agents need the *why*.

- **2026-05-17** — Adopted Earned as a 5th selectable theme rather than replacing existing themes. Reason: zero blast radius, lets us A/B against current themes, easy rollback if user reception is poor.
- **2026-05-17** — Used `next/font/google` for Poppins + Caveat rather than self-hosting the 22 TTFs from the design bundle. Reason: idiomatic Next.js, smaller bundle, automatic font subsetting.
- **2026-05-17** — Today screen v1 ships flat habit list (no hero-habit picker, no tone-by-pattern). Reason: scope discipline — personalization deferred to Phase 6 so the visual layer can ship first.
- **2026-05-17** — Counter habits render as binary toggle on Earned for v1. Reason: matches the design's visual consistency; incremental logging lands in Phase 1.
- **2026-05-17** — No DayNavigator on Earned dashboard. Reason: design framing is "Today is for today" — past-day browsing lives in `/progress` (later `/stars`).
