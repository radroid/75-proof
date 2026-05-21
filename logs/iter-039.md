# iter-039 — SparklesEarned variant + Coach nav swap

**Branch:** `earned/iter039-sparkles-variant` → PR base `ux-refresh-simplified-challenge-driven`. Single PR. Branched off integration tip (`f490286` — no PRs landed this iter).

**Scope:** continue the sidebar nav swap series — third of four targets. `Sparkles` for the Coach tab.

## Merge events this iter

None. All five pending PRs (#81, #83, #86, #88, #90) are CLEAN + MERGEABLE but `reviewDecision` is empty across the board.

## Shipped

- **`components/earned/icons/sparkles.tsx`** (NEW) — `SparklesEarned` hand-drawn variant. Three pen-tap twinkles in different sizes (big left-center, medium top-right, small bottom-right). Each twinkle is a `+` of two crossing strokes. `strokeWidth={1.7}`, round caps/joins, `rotate(-3deg)` (slightly more rotation than other variants to give the twinkles a "sparkle-tossed" feel).
- **`components/earned/icons/themed-icon.tsx`** — added Lucide `Sparkles` import, `SparklesEarned` import, `"sparkles"` entry in `IconName` union, and the variant-map entry with a 5-line comment.
- **`app/(dashboard)/layout.tsx`** — both JSX usages of `<Sparkles className="h-5 w-5 flex-shrink-0" />` swapped to `<ThemedIcon name="sparkles" ... />`:
  - L83 — guest-mode desktop sidebar nav "Coach" row
  - L327 — authenticated desktop sidebar nav "Coach" row
  - `Sparkles` removed from the Lucide import entirely (no other usages remain — confirmed via grep). Updated the stale comment at L279 that referenced "The Sparkles import stays in scope."
- **`app/design-system/page.tsx`** — added `"sparkles"` to `ICON_NAMES` (24 → 25 entries on this branch; 28 once all open PRs land).

## Verified

- `npx next build` passes.
- `grep "<Sparkles\b" app/(dashboard)/layout.tsx` returns empty (only the comment reference remains, intentional).
- No Class A review — third icon in the same hand-drawn vocabulary as LayoutDashboardEarned (iter-037, ratified) and TrendingUpEarned (iter-038). Pattern Class-A-ratified.

## Open backlog

- `#20` (Phase 4 IA blocker) — user-blocked.
- `#30` (counter habit interaction model) — user-blocked.
- **Phase 9 main-merge gate** — user-blocked.
- **PR #81 / #83 / #86 / #88 / #90** — all MERGEABLE, all awaiting `reviewDecision`. Six PRs queued for user review now (including this one).

## Followups

- **`LogInEarned` variant + swap** — last of the four sidebar nav targets. Two JSX usages in `layout.tsx` (`GuestSidebarFooter` L213 and L222 — collapsed sidebar button + expanded sign-up button). Door-with-arrow vocabulary.
- **Mobile bottom nav swap** for `LayoutDashboard`, `TrendingUp`, and (once it lands) `Sparkles` — currently uses component-reference pattern. Thin wrapper components at the mobile-nav config site. `ProgressMobileIcon` inside `mobile-bottom-nav.tsx` also renders Lucide `<TrendingUp>` directly.
- **`strokeWidth` extension on ThemedIcon** (iter-029 followup): viable as soon as PR #81 lands.

## Wake-up handoff

- **Current phase:** Earned transition — integration mature. Three of four sidebar nav variants done (LayoutDashboard via #89, TrendingUp via #90, Sparkles via this iter). `LogIn` still pending.
- **PRs in flight:** **PR #81** (iter-029), **PR #83** (iter-031), **PR #86** (iter-034), **PR #88** (iter-036), **PR #90** (iter-038), **PR #<this iter>** (iter-039).
- **Next step (iter-040):** (1) merge any approved PR. After each merge, rebase survivors using the established multi-region pattern. (2) `logs/blocks.md` user-block scan. (3) candidates: (a) **only after PR #81 lands** — `strokeWidth` extension + theme-switcher restore + sync `check` into `ICON_NAMES`; (b) `LogInEarned` variant + guest sign-in nav row swap — finishes the sidebar nav family; (c) mobile-bottom-nav wrappers to finally swap on mobile.
- **Files to open first:** `logs/blocks.md`, `components/earned/icons/themed-icon.tsx`, `app/(dashboard)/layout.tsx`, `components/ui/mobile-bottom-nav.tsx`.
- **Carry-forward:** state.json iter `37 → 39` (skipped 38 since PR #90's branch holds that bump).
- **Scheduled:** 3000s — review-cadence-driven; six PRs queued is the bottleneck.

## Push: ok — branch pushed when PR opened.
