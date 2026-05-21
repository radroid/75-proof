# iter-035 — progress/page.tsx challenge-picker status badges (Play + Trophy)

**Branch:** `earned/iter035-progress-status-badges` → PR base `ux-refresh-simplified-challenge-driven`. Single PR. Branched off integration tip (`516fb6d` — unchanged from iter-034; no PRs landed).

**Scope:** swap two of three sibling status-badge icons inside the challenge-picker dropdown in `/dashboard/progress`. The iter-035 prompt specifically called for Trophy at L747, but the surrounding `Play` (L744) and `XCircle` (L750) form a status badge cluster — swapping only one would create a within-Earned visual inconsistency. Going with the smallest correct fix: bundle Play + Trophy (both have existing variants); flag XCircle for a new variant in a future iter.

## Merge events this iter

None — all three pending PRs (#81, #83, #86) are CLEAN + MERGEABLE but `reviewDecision` is empty across the board. The user hasn't reviewed them yet; cannot self-merge per workflow. The merge-then-rebase cycle is fully unblocked tooling-wise (permission rule works) but rate-limited on user-review cadence now.

## Shipped

- **`app/(dashboard)/dashboard/progress/page.tsx`** L744 — `<Play className="h-3 w-3 text-primary" />` (active-challenge status glyph in challenge-picker dropdown row) → `<ThemedIcon name="play" className="h-3 w-3 text-primary" />`.
- **`app/(dashboard)/dashboard/progress/page.tsx`** L746 — `<Trophy className="h-3 w-3 text-success" />` (completed-challenge status glyph) → `<ThemedIcon name="trophy" className="h-3 w-3 text-success" />`.
- **`app/(dashboard)/dashboard/progress/page.tsx`** L22-31 — removed `Trophy` and `Play` from the Lucide import; added the `ThemedIcon` import. `Calendar` remained in the Lucide import because PR #86 (iter-034) is the one that removes it; deliberately scoped this iter's edit to NOT touch the same line as #86 to keep the eventual merge conflict tiny. `XCircle` also stays — the failed-challenge status glyph at L750 has no Earned variant yet (see Followups).

## Verified

- `npx next build` passes.
- `grep "<Play\|<Trophy" app/(dashboard)/dashboard/progress/page.tsx` returns no Lucide use-sites.
- No Class A review — both swaps are 1:1 to existing variants (`play` since the activity-feed pass, `trophy` since iter-019) at h-3 w-3 inside a dropdown row. Pattern Class-A-ratified.

## Open backlog

- `#20` (Phase 4 IA blocker) — user-blocked.
- `#30` (counter habit interaction model) — user-blocked.
- **Phase 9 main-merge gate** — user-blocked.
- **PR #81 / #83 / #86** — all MERGEABLE, all awaiting user `reviewDecision`. The merge cycle is gated on review now, not on tooling.

## Followups

- **Create `XCircleEarned` variant + `"x-circle"` entry in `ThemedIcon`**, then come back to `progress/page.tsx` L750 to swap the third status badge in this cluster. Design suggestion: a hand-drawn open circle with the existing `CrossMarkEarned` X strokes inside — leverages the missed-day vocabulary already established for the calendar grid.
- **Sidebar nav variants** (`LayoutDashboard`, `TrendingUp`, `LogIn`, `Sparkles`) — still deferred; medium scope, four new icons + a swap pass in `app/(dashboard)/layout.tsx`.
- **`strokeWidth` extension on ThemedIcon** (iter-029 followup): viable as soon as PR #81 lands.

## Wake-up handoff

- **Current phase:** Earned transition — integration mature. Three PRs queued for user review; the loop's merge tooling is unblocked but no merges can flow until you approve.
- **PRs in flight:** **PR #81** (iter-029 CheckEarned + metadata voice, MERGEABLE), **PR #83** (iter-031 NoActiveChallenge Rocket, MERGEABLE), **PR #86** (iter-034 progress Calendar swap, MERGEABLE), **PR #<this iter>** (iter-035, new).
- **Next step (iter-036):** (1) merge whatever the user approved; rebase any DIRTY survivors. (2) `logs/blocks.md` user-block scan. (3) candidates if all queued: (a) **only after PR #81 lands** — `strokeWidth` extension + theme-switcher restore + sync `check` into `ICON_NAMES`; (b) create `XCircleEarned` variant + swap L750 in progress/page.tsx to complete the status-badge cluster from this iter; (c) sidebar nav variants in `layout.tsx` (4 new icons, bigger scope).
- **Files to open first:** `logs/blocks.md`, `components/earned/icons/themed-icon.tsx`, `app/(dashboard)/dashboard/progress/page.tsx`, `app/(dashboard)/layout.tsx`.
- **Carry-forward:** state.json iter `33 → 35` (skipped 34 since PR #86's branch holds that bump).
- **Scheduled:** 1800s — review-cadence-driven; will re-evaluate on next wake.

## Push: ok — branch pushed when PR opened.
