# iter-038 — TrendingUpEarned variant + Progress nav swap

**Branch:** `earned/iter038-trending-up-variant` → PR base `ux-refresh-simplified-challenge-driven`. Single PR. Branched off integration tip post-#89-merge (`f490286`).

**Scope:** continue the sidebar nav swap series with the second of four targets — `TrendingUp` for the Progress tab (and the ProgressNavIcon wrapper that adds the pending-friend-request badge).

## Merge events this iter

- **PR #89 (iter-037 LayoutDashboardEarned)** merged via direct `gh pr merge --squash --delete-branch`. APPROVED + CLEAN.
- **PR #81 (iter-029 CheckEarned + metadata voice)** re-rebased + force-pushed. Multi-file conflict resolution: themed-icon.tsx had 4 conflict regions (Lucide import + Earned import + IconName union + variants map entry) — resolved by keeping BOTH PR #81's `check` additions and integration's newly-landed `layout-dashboard` additions. Build clean.
- **PR #83 (iter-031 NoActiveChallenge Rocket)** re-rebased + force-pushed. themed-icon.tsx auto-merged cleanly (PR #83's a11y doc note doesn't overlap with the variant additions). Build clean.
- **PR #86 (iter-034 progress Calendar)** re-rebased + force-pushed. Only bookkeeping conflicts on state.json + latest.md. Build clean.
- **PR #88 (iter-036 XCircleEarned)** re-rebased + force-pushed. Multi-file conflict resolution: themed-icon.tsx had 4 conflict regions (same pattern as #81), plus app/design-system/page.tsx had a conflict on ICON_NAMES — resolved by keeping BOTH `x-circle` (PR #88) and `layout-dashboard` (integration) in the variant map + union + design-system list. Build clean.

## Shipped

- **`components/earned/icons/trending-up.tsx`** (NEW) — `TrendingUpEarned` hand-drawn variant. Upward zigzag polyline (M3.5 16.6 → 9.2 11.2 → 12.8 14.5 → 20.4 7.3) + small arrowhead (M14.4 7.4 → 20.6 7.2 → 20.4 13.5) at the top-right. `strokeWidth={1.7}`, round caps/joins, `rotate(-2deg)`. Mirrors Lucide's TrendingUp metaphor in the same notebook vocabulary as the rest of the icon set.
- **`components/earned/icons/themed-icon.tsx`** — added Lucide `TrendingUp` import, `TrendingUpEarned` import, `"trending-up"` entry in `IconName` union, and the variant-map entry with a 4-line comment.
- **`app/(dashboard)/layout.tsx`** — both JSX usages of `<TrendingUp className="h-5 w-5..." />` swapped to `<ThemedIcon name="trending-up" ... />`:
  - L56 — inside the `ProgressNavIcon` wrapper component (sidebar Progress row that adds the pending-request badge)
  - L78 — desktop sidebar nav "Progress" row, authenticated branch
  - `TrendingUp` stays in the Lucide import because L283 (mobile bottom nav) still passes the component reference — deferred until ThemedIcon supports component-reference signature or a wrapper component is added.
- **`app/design-system/page.tsx`** — added `"trending-up"` to `ICON_NAMES` (24 → 25 entries).

## Verified

- `npx next build` passes (on this iter's PR and on all four rebased survivor PRs after each force-push).
- `grep "<TrendingUp" app/(dashboard)/layout.tsx` returns empty.
- No Class A review — single icon swap following the same vocabulary as `LayoutDashboardEarned` (iter-037, ratified by review on PR #88 as part of the variant family). Pattern Class-A-ratified.

## Open backlog

- `#20` (Phase 4 IA blocker) — user-blocked.
- `#30` (counter habit interaction model) — user-blocked.
- **Phase 9 main-merge gate** — user-blocked.
- **PR #81 / #83 / #86 / #88** — all MERGEABLE after re-rebase, all awaiting `reviewDecision`.

## Followups

- **Mobile bottom nav swap** for `LayoutDashboard` + `TrendingUp` — both still use component-reference (`icon: LayoutDashboard`, `icon: TrendingUp` at L282-283 of layout.tsx). Easiest path is thin wrapper components (`const TrendingUpThemed = (p: IconProps) => <ThemedIcon name="trending-up" {...p} />`) at the mobile-nav config site. ProgressMobileIcon component (L37 of mobile-bottom-nav.tsx) also renders Lucide `<TrendingUp>` directly — same wrapper pattern applies.
- **Remaining sidebar nav variants**: `Sparkles` (Coach tab) and `LogIn` (guest sign-in nav row). Each needs a hand-drawn variant + JSX swap.
- **iter-029 followup** — `strokeWidth` extension on ThemedIcon, theme-switcher restore, sync `check` into `ICON_NAMES`. Viable as soon as PR #81 lands.

## Wake-up handoff

- **Current phase:** Earned transition — integration mature. Two of four sidebar nav variants done (LayoutDashboard via #89, TrendingUp via this iter).
- **PRs in flight:** **PR #81** (iter-029), **PR #83** (iter-031), **PR #86** (iter-034), **PR #88** (iter-036), **PR #<this iter>** (iter-038).
- **Next step (iter-039):** (1) merge any approved PR. (2) `logs/blocks.md` user-block scan. (3) candidates if all queued: (a) **only after PR #81 lands** — `strokeWidth` extension + theme-switcher restore + sync `check` into `ICON_NAMES`; (b) `SparklesEarned` variant + Coach nav row swap (4-pointed twinkle vocabulary, similar to `flame` weight); (c) `LogInEarned` variant + guest sign-in nav row swap (door-with-arrow vocabulary); (d) mobile-bottom-nav wrappers so LayoutDashboard + TrendingUp finally swap on mobile.
- **Files to open first:** `logs/blocks.md`, `components/earned/icons/themed-icon.tsx`, `app/(dashboard)/layout.tsx`, `components/ui/mobile-bottom-nav.tsx`.
- **Carry-forward:** state.json iter `37 → 38`.
- **Scheduled:** 3000s — review-cadence-driven.

## Push: ok — branch pushed when PR opened.
