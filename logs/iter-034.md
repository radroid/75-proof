# iter-034 — progress/page.tsx empty-state Calendar → ThemedIcon swap

**Branch:** `earned/iter034-progress-empty-calendar` → PR base `ux-refresh-simplified-challenge-driven`. Single PR. Branched off integration tip post-#85-merge (`516fb6d`).

**Scope:** one targeted Lucide → ThemedIcon swap on the most visible empty-state inside `/dashboard/progress` + cleanup of the now-orphan Lucide `Calendar` import.

## Merge events this iter

- **PR #85 (iter-033 design-system Components section)** merged via direct `gh pr merge --squash --delete-branch`. APPROVED + CLEAN, permission rule covered it.
- **PR #81 (iter-029)** re-rebased against post-#85 integration tip. `--theirs` for state.json + latest.md. Build passes; force-pushed. Still MERGEABLE, still no `reviewDecision`.
- **PR #83 (iter-031)** re-rebased same shape. MERGEABLE, awaiting review.

The merge-then-rebase-everything-else dance is now mechanical and fast — three operations per PR (rebase, force-push, build verify) thanks to the permission rule.

## Shipped

- **`app/(dashboard)/dashboard/progress/page.tsx`** L885-887 — the `<EmptyState>` shown when day-filter returns no results. Hero icon swapped from `<Calendar className="h-8 w-8" />` to `<ThemedIcon name="calendar-days" className="h-8 w-8" />`. Empty state title + description voice were already neutral/acceptable so no copy changes.
- **`app/(dashboard)/dashboard/progress/page.tsx`** L22-31 — removed `Calendar` from the Lucide import (confirmed no other usages — `CalendarGrid` at L62 is a separate component) and added the `ThemedIcon` import. Eight Lucide imports remain (`Check`, `ChevronDown`, `ChevronRight`, `Filter`, `Trophy`, `Play`, `XCircle`, `X`) — all utility chrome, acceptable as Lucide per the iter-028 survey rule. Brand-visible Calendar was the swap-worthy one on this surface.

## Verified

- `npx next build` passes (no type errors, no orphan imports).
- No Class A review — single 1:1 swap to an already-existing ThemedIcon variant (`calendar-days`, on integration since the Earned scaffolding landed) + an orphan-import cleanup. Pattern already Class-A-ratified in earlier iters.

## Open backlog

- `#20` (Phase 4 IA blocker) — user-blocked.
- `#30` (counter habit interaction model) — user-blocked.
- **Phase 9 main-merge gate** — user-blocked.
- **PR #81 + PR #83** — both MERGEABLE after re-rebase, both awaiting `reviewDecision`. Once approved, the next iter merges + rebases survivor.

## Followups carried over

- Extend `ThemedIcon` with optional `strokeWidth?: number` prop forwarded only to the Lucide branch + restore `strokeWidth={3}` at the theme-switcher call site (iter-029 followup). Viable after PR #81 lands. Also sync `check` into `ICON_NAMES` in `app/design-system/page.tsx` at the same time.
- Sidebar nav swap in `app/(dashboard)/layout.tsx` — needs 4 new hand-drawn variants (LayoutDashboard / TrendingUp / LogIn / Sparkles). Bigger scope; defer.
- Remaining progress/page.tsx Lucide use-sites (8 imports × 13 use-sites): mostly utility chrome (chevrons, filter, X) — acceptable on Earned per the blocks.md note. `Check` and `Trophy` are visually-significant glyphs but appear at small sizes (h-3 / h-4) inside dense activity rows; swap could be done with the existing `check` (PR #81) and `trophy` variants when ready.

## Wake-up handoff

- **Current phase:** Earned transition — integration mature; Phase 9 main-merge gate is the next material event. Six PRs landed in the last hour-ish (iters 028-033), plus this one queued.
- **PRs in flight:** **PR #81** (iter-029, MERGEABLE, no approval), **PR #83** (iter-031, MERGEABLE, no approval), **PR #<this iter>** (iter-034, new).
- **Next step (iter-035):** (1) merge whatever the user approved; rebase the rest. (2) `logs/blocks.md` user-block scan. (3) candidates if all queued: (a) **only after #81 lands** — the `strokeWidth` extension + theme-switcher restore + sync `check` into `/design-system` ICON_NAMES (a 3-step natural pairing); (b) `progress/page.tsx` next-most-visible swap (`Trophy` at L747 inside activity-row badge, h-3 w-3 — uses existing `trophy` variant; clean 1:1); (c) sidebar nav variants (4 new icons, bigger scope).
- **Files to open first:** `logs/blocks.md`, `components/earned/icons/themed-icon.tsx`, `app/(dashboard)/dashboard/progress/page.tsx`.
- **Carry-forward:** state.json iter `33 → 34`.
- **Scheduled:** 1800s — work is shallow; review-cadence-driven now.

## Push: ok — branch pushed when PR opened.
