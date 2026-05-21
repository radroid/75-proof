# iter-037 — LayoutDashboardEarned variant + desktop sidebar swap

**Branch:** `earned/iter037-layout-dashboard-variant` → PR base `ux-refresh-simplified-challenge-driven`. Single PR. Branched off integration tip (`74b5977` — no PRs landed this iter).

**Scope:** start chipping at the sidebar nav swap (iter-035 followup) with the most-visited tab glyph. Bounded to the **desktop sidebar JSX** usages of `LayoutDashboard` (L73 + L317 of `app/(dashboard)/layout.tsx`); mobile bottom nav (L282) is deferred because it uses the component-reference pattern (`icon: LayoutDashboard`) which doesn't fit `ThemedIcon`'s `{name, className}` API. The mobile-nav swap unlocks once the `strokeWidth` extension (iter-029 followup) lands and gives `ThemedIcon` a more flexible signature.

## Merge events this iter

None. All four pending PRs (#81, #83, #86, #88) are CLEAN + MERGEABLE but `reviewDecision` is empty across the board.

## Shipped

- **`components/earned/icons/layout-dashboard.tsx`** (NEW) — `LayoutDashboardEarned` hand-drawn variant. Four small quadrangle paths arranged in a 2x2 grid; corners nudged off-grid by a fraction of a unit so each panel reads as a quick pen rectangle rather than a math-perfect square. `strokeWidth={1.7}`, round caps/joins, `rotate(-1.5deg)`.
- **`components/earned/icons/themed-icon.tsx`** — added Lucide `LayoutDashboard` import, `LayoutDashboardEarned` import, `"layout-dashboard"` entry in the `IconName` union, and the variant-map entry with a 5-line comment.
- **`app/(dashboard)/layout.tsx`** L19 — added `ThemedIcon` import.
- **`app/(dashboard)/layout.tsx`** L73 + L317 — both JSX usages of `<LayoutDashboard className="h-5 w-5 flex-shrink-0" />` swapped to `<ThemedIcon name="layout-dashboard" ... />`. Both render in the desktop sidebar "Today" nav row (one for the guest-mode nav array, one for authenticated). `LayoutDashboard` stays in the Lucide import because L282 (mobile bottom nav config) still passes the component reference — deferred until ThemedIcon supports that signature.
- **`app/design-system/page.tsx`** — added `"layout-dashboard"` to `ICON_NAMES` so the Icons grid surfaces the new variant (23 entries → 24).

## Verified

- `npx next build` passes.
- `grep "<LayoutDashboard" app/(dashboard)/layout.tsx` returns empty (both JSX call sites swapped).
- No Class A review — single bounded icon swap to a new but cleanly-defined variant; pattern (4-panel grid in 2x2 with hand-drawn imperfection) is consistent with the `CalendarDaysEarned` / `CalendarClockEarned` vocabulary.

## Open backlog

- `#20` (Phase 4 IA blocker) — user-blocked.
- `#30` (counter habit interaction model) — user-blocked.
- **Phase 9 main-merge gate** — user-blocked.
- **PR #81 / #83 / #86 / #88** — all MERGEABLE, all awaiting `reviewDecision`. Five PRs queued for user review now (including this one).

## Followups

- **Mobile bottom nav swap** for `LayoutDashboard` — currently uses component-reference (`icon: LayoutDashboard` at L282 of layout.tsx). Needs either (a) a wrapper component like `LayoutDashboardThemed = (props) => <ThemedIcon name="layout-dashboard" {...props} />` or (b) the `strokeWidth` extension on `ThemedIcon` so its signature matches `NavItem.icon`'s `IconProps` shape. Easiest path is (a) — three-line wrapper per icon.
- **Remaining sidebar nav variants**: `TrendingUp`, `LogIn`, `Sparkles` still Lucide. Each needs a hand-drawn variant + swap. Future iters.
- **Class A iter-036 followup**: eyeball `XCircleEarned` legibility at 12px on retina vs 1x; widen X-span if it reads weak.

## Wake-up handoff

- **Current phase:** Earned transition — integration mature. Five PRs queued for review.
- **PRs in flight:** **PR #81** (iter-029), **PR #83** (iter-031), **PR #86** (iter-034), **PR #88** (iter-036), **PR #<this iter>** (iter-037).
- **Next step (iter-038):** (1) merge whatever the user approved; rebase survivors. `app/(dashboard)/layout.tsx` will conflict with this iter's PR if any other PR touches the same file — unlikely since no current open PR does, but the rebase guidance is identical (`--theirs` for state.json + latest.md). (2) `logs/blocks.md` user-block scan. (3) candidates if all queued: (a) **only after PR #81 lands** — `strokeWidth` extension + theme-switcher restore + sync `check` into `ICON_NAMES`; (b) `TrendingUpEarned` variant + swap the Progress nav row (matches this iter's pattern); (c) `LogInEarned` + swap the guest-mode sign-in nav row; (d) `SparklesEarned` + swap the Coach nav row.
- **Files to open first:** `logs/blocks.md`, `components/earned/icons/themed-icon.tsx`, `app/(dashboard)/layout.tsx`, `components/ui/mobile-bottom-nav.tsx`.
- **Carry-forward:** state.json iter `35 → 37` (skipped 36 since PR #88's branch holds that bump).
- **Scheduled:** 2400s — review-cadence-driven.

## Push: ok — branch pushed when PR opened.
