# iter-010 — decade rollup + Phase 1 motion polish on EarnedDashboard

**Branch:** `earned/iter010-decade-rollup-motion` → PR into `ux-refresh-simplified-challenge-driven`
**Scope:** Decade-rollup bookkeeping + checkbox tick motion + StarBurst celebration.

## Shipped
- **Decade rollup** — moved `logs/iter-001.md`…`iter-009.md` to `logs/archive/`. Wrote `logs/summary-001-009.md`: closed-task index per iter + key decisions (PR-mode, CSS-overlay before JSX, design-review-over-Playwright, hand-drawn icon swap pattern) + design-review patterns that emerged across the decade.
- **HandCheckbox motion** (`components/earned/hand-checkbox.tsx`) — added `"use client"`, switched to `motion.button` + `motion.path`:
  - Paper-crinkle scale `[1, 1.02, 1]` over 400ms on tap (only fires on state flip via `initial={false}`).
  - Inner star path appears + settles: opacity `0 → 1` + scale `[0.5, 1.05, 1]` over 300ms with origin at the star's centroid (via `transformBox: fill-box`).
  - Note: switched from pathLength to opacity+scale because the path is fill-only with no stroke — pathLength would not produce a visible draw-on (caught by Class A reviewer).
  - `useReducedMotion()` fallback renders the static final state.
- **StarBurst celebration** (`components/earned/star-burst.tsx`, new) — gold Star with 3-spoke ink burst at angles `-90° / 30° / 150°`. Star scales `[0.9, 1.2, 1]` over 550ms; rays draw outward from radius 22 → 40 with stroke-dashoffset + opacity peak at 40% then fade by 100%, staggered 40ms apart. Reduced-motion users see the static star alone — no rays mount.
- `components/themes/earned-dashboard.tsx` — swapped `<Star size={72} />` for `<StarBurst size={72} />` inside the existing celebration block. The outer AnimatePresence spring still fades the whole block in; StarBurst's keyframe pops the star within. Layers cleanly.

## Verified
- `npx next build` passes.
- **Class A design-review verdict: APPROVE_WITH_FOLLOWUPS.** Confirmed spec compliance (300ms paths, 1.02 amplitude, 1.2 star pop), reduced-motion correctness, no clipping at the celebration size, no jank in the AnimatePresence composition. Reviewer caught the **pathLength-on-fill-only-path** issue (silent no-op) before commit — fixed by swapping to opacity+scale.

## Deferred (non-blocking, opportunistic)
- Animate the checkbox outer-box outline stroke-on for full spec compliance ("ink stroke draws onto the box"). Currently the outline path is statically rendered; only fill changes when state flips. Small CSS/SVG work; pick up when next touching the file.
- Sync any future docstring drift in `star-burst.tsx`.

## Backlog status
- Closed: none new (Phase 1 motion polish wasn't a tracked TaskList item; this iter discharges it implicitly).
- Open: #20 (Phase 4 IA blocker), #30 (counter habit — user call).
- Discovered: outer-box outline stroke-on follow-up (noted above, not promoted to TaskList).

## Merged this iter
- PR #60 (iter-009 — closing #32 with last 7 icons + handwritten value treatment) — CR check green; CHANGES_REQUESTED verdict was a minor markdown-lint nit on `iter-009.md` (a file being archived this iter — moot). Squash-merged.

## Wake-up handoff
- **Current phase:** Earned transition — Phase 1 motion now landed, Phase 2 large surfaces next.
- **Next step:** Pick `/dashboard/progress` Earned restyle as iter-011's main feature — L-sized so will likely span 2-3 iters. Start with the headline metrics + calendar grid (highest-discovery surfaces); identity card + per-habit sparkline in follow-up. Per-iter design-review subagent before commit.
- **Files to open first:** `app/(dashboard)/dashboard/progress/page.tsx`, `components/progress/calendar-grid.tsx`, design-system reference at `design-system/project/ui_kits/earned-ios/screens.jsx` § StarsScreen (L150-205 area).
- **Open questions:** counter habit interaction model (#30) — still parked.
- **Carry-forward:** none. state.json iter `9 → 10`, latest.md → `iter-010.md` (this iter), archived prior 9 logs.
- **Scheduled:** 900s — impl iter + design-review buffer.

## Push: ok — branch pushed when PR opened.
