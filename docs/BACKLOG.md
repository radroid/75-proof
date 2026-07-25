# Backlog

The working backlog for **earned**. Flat and evidence-carrying by design: every item cites a
`file:line` so status can be re-checked in seconds instead of re-derived. No phases, no
per-branch checkboxes, no effort tables — that structure is exactly what rotted the file this
replaces.

> **History.** This supersedes `docs/EARNED_TRANSITION.md`, which lived only on the abandoned
> umbrella branch `ux-refresh-simplified-challenge-driven` (draft PR #37). The rebrand it planned
> shipped to `main` by a different route (PRs #93–#96, June 2026), so its checkboxes never tracked
> reality and its phase ordering ran backwards (it treated the default-theme flip — shipped in #94 —
> as the final step). The umbrella and two sibling branches were salvaged and deleted on 2026-07-22;
> their tips are preserved as `archive/*` tags (see the decisions log). Where an item below references
> code that was built on the umbrella but not kept, it cites the archive tag.

Status as of the 2026-07-22 audit: of the old doc's 59 items, ~2 done, ~19 partial, ~37 not
started, several obsolete. What follows is what's actually left, re-scoped against `main`.

A load-bearing fact for all of it: `grep -rn '=== "earned"'` returns **one** hit repo-wide. Earned
is the default and near-only theme now — the earned tokens sit on `:root` (`app/globals.css:108`).
New work should restyle **unconditionally against tokens**, not add `theme === "earned"` branches.
Surfaces that *look* earned often only inherit the global tokens while still being generic shadcn
underneath — grep for a real earned import before assuming a surface is done.

---

## Now

Roughly in order. The first five are small correctness/infra fixes; the last two are the highest
visible-polish wins.

1. **Fix `eslint.config.mjs`, then add CI. (S)**
   `globalIgnores([...])` at `eslint.config.mjs:9` *replaces* eslint-config-next's defaults and never
   re-adds `.open-next/**`, so ESLint lints the minified Cloudflare bundle — ~26,722 reported
   problems burying ~122 real source errors. Add `.open-next/**` to the ignore list; source-only
   count becomes readable. Then add a `.github/workflows/` job (only `pull_request_template.md` lives
   under `.github/` today — nothing has ever run `bun lint` or `bun run test` on a PR). Note in
   CLAUDE.md: bare `bun test` falsely reports failures (Bun's runner shadows the script and chokes on
   `import.meta.glob`) — CI must call `bun run test`.
   *Done when:* `bun lint` reports source-only errors, and a PR runs lint + build + test.

2. **Today's streak number is wrong. (S)**
   `components/themes/earned-dashboard.tsx:338` renders `{todayDayNumber}` under the label
   `"day streak"` (`:340`). That's the day index, not the streak — and `convex/challenges.ts` gives a
   miss a multi-day grace before failing, so they genuinely diverge (day 40 with misses still reads
   "40 day streak"). `progress/page.tsx:359` computes the real value; the helper already exists at
   `lib/progress-metrics.ts:119`. Wire it in or relabel to "day N of 75".
   *Done when:* Today and Progress show the same streak, or Today stops calling the day index a streak.

3. **Reduced-motion + confetti palette, one PR. (S)**
   `components/ui/confetti.tsx` fires 50 framer-motion particles with **no** reduced-motion guard
   (`grep useReducedMotion` → 0 hits; the old `DailyChecklist.tsx` guarded at five sites, the earned
   components at none). The `globals.css:736` blanket rule only clamps CSS `animation-duration` — it
   can't touch JS-driven transforms. Same file: the particle colors (`confetti.tsx:13`, emerald/amber/
   sky oklch) are the old arctic palette celebrating an earned milestone on cream under a gold star.
   Add `<MotionConfig reducedMotion="user">`, an early return in Confetti, and a `colors` prop set to
   gold/ink/cream.
   *Done when:* reduced-motion users get a still celebration and particles match the earned palette.

4. **Focus rings + gold contrast on the Today surface. (M)**
   `grep focus-visible` across `components/themes/earned/EarnedPaper.tsx` (916 lines) → nothing. The
   checkbox (`:605`) and habit row (`:838`) are raw `<button>` with `border: none`, bypassing shadcn's
   ring — a keyboard user is invisible on the default screen of the default theme. Separately, gold
   `#D8A830` on cream is ~1.7–2.0:1 against the 3:1 floor for non-text graphics, and the gold star is
   the brand thesis. Add visible focus rings, bump the gold, add `aria-label={`Day ${day} of ${total}`}`.
   *Done when:* keyboard focus is visible on every Today control and the star meets 3:1.

5. **Instrument the default Today screen. (S)**
   `posthog.capture("day_completed")` fires from exactly one site — `components/DailyChecklist.tsx:60`,
   the *legacy* checklist. `earned-dashboard.tsx:189` routes every guest and dynamic-habit user to
   `EarnedChecklist`, which has no PostHog import. The default Today screen has emitted no completion
   event since 24 June, so every analytics question about the rebrand is currently uncomputable. Add a
   `day_completed` capture in `EarnedChecklist`, plus `today_loaded { theme }` and a `theme_switched`
   event at `components/theme-provider.tsx` (~L73). (Name it `today_loaded`, not `earned_today_loaded`
   — that old name assumed earned was 1-of-5.)
   *Done when:* the default Today path emits completion + load events, verified in PostHog.

6. **Restyle `/dashboard/progress` to the earned paper look. (L)**
   Biggest visible gap — it's still generic shadcn under the global tokens. The umbrella branch built
   this; reference, don't cherry-pick, via
   `git diff main archive/umbrella-ux-refresh -- 'app/(dashboard)/dashboard/progress/page.tsx' components/progress`.
   Do this **after** item 7 of *Next* (extract shared primitives) or you'll mint a fourth inline copy
   of the hand-drawn button.
   *Done when:* Progress imports earned primitives and reads as one surface with Today.

7. **Swap the pre-rebrand onboarding logo. (S)**
   `app/(onboarding)/onboarding/layout.tsx:3,17` still renders a lucide `<Dumbbell>` in a `bg-primary`
   square next to the word "earned" — the last pre-rebrand 75-hard mark, on the first screen a new
   user sees. `/logo.svg` already exists. ~5 lines. Unblocked; ship anytime.
   *Done when:* onboarding shows the earned mark.

---

## Next

Real work, not urgent.

- **Restyle the remaining surfaces to earned paper, unconditionally against tokens (not gated on
  theme):** `/dashboard/settings`, `/dashboard/coach`, `/onboarding`, Clerk auth appearance
  (`lib/clerk-appearance.ts`), and the error/`not-found`/`offline` pages. Each its own PR. The
  umbrella's versions are in `archive/umbrella-ux-refresh` for reference. (Gate the Coach restyle on
  the Coach-placement decision below — it may be an [L] you'd throw away.)
- **Extract shared earned primitives** from `EarnedPaper.tsx` into `components/earned/` (`HandButton`,
  `PaperChip`, `HandCheckbox`, `PageHeader`, `PaperBg`) — prerequisite for the Progress restyle and
  every surface after it. (Note: the hand-drawn **icon** set already landed on `main` via this
  cleanup — `components/earned/icons/` with the `ThemedIcon` dispatcher. Wiring it into surfaces that
  still use raw lucide is part of each restyle, no longer separate work.)
- **First-person voice pass** on toast + dialog copy (`toast.success` / `toast.error` call sites,
  the failed/completed/reconciliation dialogs) and push-notification strings. Sentence case, no shame,
  no emoji in system copy. The word-swap rules live in `.claude/skills/earned-design/SKILL.md`. (Scope
  note under *Struck* — this is narrower than the old "strip all emoji" item.)
- **Theme-adaptive PWA `theme-color`.** `app/layout.tsx:90` is statically `#F4ECD8` (correct for the
  default; #94 already fixed the old `#FF6154`). Only matters for users who switch to a non-earned
  theme — low priority, listed so nobody re-files it as a bug.
- **Service-worker / install-prompt copy** → first-person voice (`public/sw.js`).
- **Migrate `middleware.ts` → the Next 16 `proxy` convention.** Non-blocking today (build warns), a
  hard break at the next major. The whole Clerk auth gate lives in that file, so do it deliberately
  with CI in place — not during a version bump at 11pm.

---

## Experiments

Speculative directions — prototype before committing. Not scheduled against the Now/Next work.

- **Life Areas — multi-domain life organizer.** Let the user switch between life *areas*
  (self-care, fitness, work/business, personal finance) the way they switch themes today, with the
  chosen area as the landing view. Each area holds **periodic tasks** (daily habit → every-6-months
  chore → one-off to-do), and each task carries a **notes/research layer** and a **product/usage
  log** (e.g. night creams tried for a skincare routine). Reuses more than it rebuilds:
  `habitDefinitions.category` already exists, habit-tracker mode is already open-ended, and the
  theme-switcher is the exact UX precedent. The one deep change is recurrence beyond the daily
  `dayNumber` grid. Full write-up, schema mapping, risk sizing, and a phased (Phase 0 = throwaway
  prototype, no migration) plan in **`docs/LIFE_AREAS_EXPLORATION.md`**. *Prototype in progress on
  `experiment/life-areas`.*

---

## Open decisions

Judgment calls that block code. Resolve and record in the log below.

- **Coach + Friends navigation placement.** The old Phase 4 blocker. All four options the old doc
  listed assumed Friends was a nav tab, which stopped being true in April. `main`'s de-facto answer:
  Friends lives inside Progress, Coach is a sibling tab — and #93 added Plan, so a flagged-on signed-in
  user sees five mobile tabs. Decide before spending an [L] restyling Coach. *Recommend:* ratify the
  de-facto layout (Coach sibling, Friends in Progress) and drop the route-rename idea.
- **`after-work-plan` flag: roll to 100% or delete.** Created 23 June, never modified, release
  condition gated to a single email. Its cron runs every ~5 min in prod (~8,600 invocations/month for
  one user). Both gates read `NODE_ENV !== "production" || flag`, so every preview build exposes the
  unfinished surface to anyone with the URL. It's also the only feature on `main` with tests (46).
  *Recommend:* set a dated call — ship it or cut it — and tighten the preview gate meanwhile.
- **Habit-creation semantics.** No `createHabit` mutation exists on Convex *or* in the local store, so
  "add a habit" can't be built until this is answered: what does adding a habit on day 40 do to
  historical day-completion? *Recommend:* new habits apply forward-only; prior days compute against the
  habit set as of that day. Four downstream items wait on this.
- **Journal scope.** Full free-write surface vs. a one-line daily prompt. Unresolved in the old doc and
  possibly mooted by the Coach decision (if Coach becomes the writing surface). Decide only when a
  journal item actually comes up.

---

## Struck from the old backlog

Recorded so nobody re-adds them.

| Struck item | Why |
| --- | --- |
| Build the `earned-theme-default` flag | The flip shipped unconditionally in #94; a flag now inverts into a kill-switch for a 100%-rolled default. Write a rollback lever as its own item if wanted. |
| sitemap/robots for renamed slugs | `sitemap.ts` returns one URL and never listed dashboard slugs; `robots.ts` disallows the `/dashboard` prefix, covering any rename. *Real* residue: `robots.ts:9` still disallows `/landing`, deleted in #94 — fix that instead. |
| Earned-vs-arctic A/B experiment | Unrunnable: ~8 onboarding completions/quarter against a 1000-per-arm stopping rule, and #94 hard-locked brand assets to earned. Accept unmeasured. |
| "Score → Streak", "Achievement → Star" swaps | Both source words have **zero** occurrences repo-wide. Dead rows. |
| Literal "strip all emoji" | Emoji reactions shipped as a real feature after the old doc; a blind strip deletes `components/.../emoji-picker.tsx`. The voice pass (in *Next*) is the correct, narrower scope: system copy only, never user content or reactions. |
| Onboarding tour "skip it for Earned" | Earned is the default — skipping for earned skips for everyone. The tour is also stale beyond theming. Rewrite-or-remove, don't gate. |
| Any "when theme is earned" framing | One hit repo-wide. Restyle unconditionally against tokens. This *raises* priority on Progress/Settings/Coach — they're the default experience, not optional theme polish. |

---

## Decisions log

Append-only. Record material scope/design calls with date and one-line rationale.

- **2026-05-17** — Adopted Earned as a 5th selectable theme rather than replacing the others.
  *(Superseded 2026-06 — see below.)* Reason at the time: zero blast radius, A/B-able, easy rollback.
- **2026-06 (PRs #93–#96)** — Shipped the rebrand directly to `main` and made earned the unconditional
  default (`app/globals.css:108`), bypassing the umbrella-branch rollout plan.
- **2026-07-22** — Retired the umbrella strategy. Salvaged the earned icon set + `ThemedIcon`, the
  `design-system/` reference bundle (fonts and duplicate logo assets dropped — 4 MB; the Satori-needs-
  the-TTF claim was false, `app/opengraph-image.tsx` uses `system-ui`), the `/design-system` route,
  `loading-text.tsx`, and the `earned-design` skill onto `main`. Dropped `theme-convex-sync.tsx` (it
  dereferences a Convex mutation that doesn't exist on `main`). PR #92's `strokeWidth` extension folded
  into the salvaged `themed-icon.tsx`. Deleted branches `ux-refresh-simplified-challenge-driven`,
  `earned/iter040-stroke-width-extension`, `earned-paper-redesign`; tips preserved as
  `archive/umbrella-ux-refresh`, `archive/iter040-stroke-width`, `archive/earned-paper-redesign`.
  Closed PRs #37 and #92. Replaced `docs/EARNED_TRANSITION.md` with this file.
