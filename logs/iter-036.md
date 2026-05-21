# iter-036 — XCircleEarned variant + cluster-completion swap + design-system sync

**Branch:** `earned/iter036-x-circle-variant` → PR base `ux-refresh-simplified-challenge-driven`. Single PR. Branched off post-#87-merge integration tip (`74b5977`).

**Scope:** complete the challenge-picker status-badge cluster that iter-035 started — Play + Trophy landed via PR #87, this iter adds the third sibling (XCircle / failed-challenge glyph) with a new hand-drawn variant + the swap site + sync into `/design-system`.

## Merge events this iter

- **PR #87 (iter-035 Play+Trophy status badges)** merged via direct `gh pr merge --squash --delete-branch`. APPROVED + CLEAN.
- **PR #81 (iter-029)** re-rebased + force-pushed. Bookkeeping `--theirs` resolution. Build clean.
- **PR #83 (iter-031)** re-rebased + force-pushed. Same shape.
- **PR #86 (iter-034)** re-rebased + force-pushed. `progress/page.tsx` import block auto-merged cleanly (both this PR's Calendar removal and #87's Play+Trophy removal coexist; ThemedIcon import preserved once). Build clean.

## Shipped

- **`components/earned/icons/x-circle.tsx`** (NEW) — `XCircleEarned` hand-drawn variant. Wobbly open ring (`<circle cx="12" cy="12" r="9.2">` with `strokeWidth={1.6}`) wrapping the same two crossing strokes used by `CrossMarkEarned`, scaled slightly inward (`M9 9.2 L 15 14.8` + `M14.8 9 L 9.2 14.8`) so the X sits inside the ring with comfortable margin. Outer SVG `strokeWidth={2}`, round caps, `rotate(-2deg)`. The ring's thinner stroke makes the X read as the primary signal at small sizes.
- **`components/earned/icons/themed-icon.tsx`** — added Lucide `XCircle` import, `XCircleEarned` import, `"x-circle"` entry in the `IconName` union, and the variant-map entry with a 6-line explanatory comment.
- **`app/(dashboard)/dashboard/progress/page.tsx`** L749 — failed-challenge status glyph: `<XCircle className="h-3 w-3 text-destructive" />` → `<ThemedIcon name="x-circle" className="h-3 w-3 text-destructive" />`. Removed `XCircle` from the Lucide import.
- **`app/design-system/page.tsx`** — added `"x-circle"` to `ICON_NAMES` so the Icons grid surfaces the new variant (now 24 entries — once PR #81 lands and adds `check`, we'll be at 25).

## Verified

- `npx next build` passes.
- `grep "<XCircle" app/(dashboard)/` returns empty.
- Class A `feature-dev:code-reviewer` design-review dispatched. Verdict: **APPROVE-WITH-FOLLOWUPS**.

## Class A reviewer followups (non-blocking)

1. **Spot-check XCircleEarned legibility at 12px (h-3 w-3) on retina vs 1x** — the X spans ~6 viewBox units rendering to ~3px; reviewer flagged it as workable but worth eyeballing before Phase 9 ships.
2. **Consider widening the X span back toward CrossMarkEarned's ~7.4-unit width** if the inner X reads weak in dev. Current 6-unit span may over-margin from the ring.
3. **Add a brief comment in `themed-icon.tsx` near the `"x-circle"` entry** noting that call sites should pass `text-destructive` so future swap sites don't accidentally drop the color class. (Logged here; doc-only nit.)

## Open backlog

- `#20` (Phase 4 IA blocker) — user-blocked.
- `#30` (counter habit interaction model) — user-blocked.
- **Phase 9 main-merge gate** — user-blocked.
- **PR #81 / #83 / #86** — all MERGEABLE after rebase, all awaiting `reviewDecision`.

## Followups carried over

- **`strokeWidth` extension on ThemedIcon** (iter-029 followup): viable as soon as PR #81 lands.
- **Sidebar nav variants** (`LayoutDashboard`, `TrendingUp`, `LogIn`, `Sparkles`) in `app/(dashboard)/layout.tsx`: deferred; medium scope, four new icons.

## Wake-up handoff

- **Current phase:** Earned transition — integration mature. Challenge-picker status cluster is now fully Earned (Play, Trophy, XCircle).
- **PRs in flight:** **PR #81** (iter-029 CheckEarned + metadata voice, MERGEABLE, awaiting review), **PR #83** (iter-031 NoActiveChallenge Rocket, MERGEABLE, awaiting review), **PR #86** (iter-034 progress Calendar swap, MERGEABLE, awaiting review), **PR #<this iter>** (iter-036, new).
- **Next step (iter-037):** (1) merge whatever the user approved; rebase survivors. (2) `logs/blocks.md` user-block scan. (3) candidates if all queued: (a) **only after PR #81 lands** — `strokeWidth` extension + theme-switcher restore + sync `check` into `ICON_NAMES`; (b) sidebar nav variants in `layout.tsx` (4 new icons, bigger scope but cohesive — could be one iter or split); (c) audit remaining Lucide use-sites in components/ for next-most-visible swap.
- **Files to open first:** `logs/blocks.md`, `app/(dashboard)/layout.tsx`, `components/earned/icons/themed-icon.tsx`.
- **Carry-forward:** state.json iter `35 → 36`.
- **Scheduled:** 2400s — review-cadence-driven; will re-evaluate on next wake.

## Push: ok — branch pushed when PR opened.
