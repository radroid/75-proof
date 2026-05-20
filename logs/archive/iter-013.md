# iter-013 — Phase 2 progress: heatmap ink-density + style hoist + legend mirror

**Branch:** `earned/phase2-progress-heatmap` → PR into `ux-refresh-simplified-challenge-driven`
**Scope:** 3 items — calendar-grid hoist + legend-mirror CR fix + HabitHeatmap Earned variant.

## Shipped
- **Cell-style lookup-table hoist** (`components/progress/calendar-grid.tsx`) — `const EARNED_CELL_STYLES: Record<EarnedCellState, CSSProperties>` keyed by `earned | today | missed | future`. Grid cells and legend swatches both read from this single source so they cannot drift apart. Cut ~15 lines from the conditional rendering. Unblocks heatmap-style reuse (though the heatmap legitimately needs its own density ramp — see below).
- **Legend-mirror CR fix** (carried from PR #63 review) — Earned legend swatches now carry the same sticker-shadow on Showed up + Today, and the missed swatch contains a small inline `CrossMarkEarned`. The legend reads as a real caption of the grid above.
- **HabitHeatmap Earned variant** (`components/progress/habit-heatmap.tsx`) — under `[data-theme="earned"]`, the 5-step ramp swaps from success-green to a cream→ink density ramp: cream-light + cream-dark border → cream-dark → 40% ink → 55% ink → ink. v1 still only renders steps 0 and 4 (binary completion), but the intermediate shades populate the legend so "Less → More" reads as a true 5-step gradient. v2 hooks in per-day completion-rate data to fill the middle steps. Non-Earned themes untouched.

## Verified
- `npx next build` passes (19 static pages, no type errors).
- **Class A design-review verdict: APPROVE_WITH_FOLLOWUPS.** Confirmed lookup-table correctness (all 4 recipes match prior inline branches), single-source-of-truth between grid + legend, no-gradients-rule compliance (all ramp entries are solid fills). Reviewer flagged step 3 vs step 4 luminance gap (`--earned-ink-soft` only ~12% lighter than `--earned-ink`) — fixed before commit by switching step 3 to `rgba(31,31,29,0.55)` for a truer 5-step ramp.

## Reviewer follow-ups (non-blocking, iter-014+)
- Step 0 cell (cream-light + cream-dark border) on cream-paper background may read very faint at low device brightness. Acceptable per metaphor ("no ink yet"); worth a real-device QA pass.
- Heatmap title attr is set on actual day cells but padding cells (`bg-transparent`, no title) are silent — confirmed screen-reader-safe; no role assigned.

## Backlog status
- Closed: none (#33 still in_progress; identity card + sparkline + CrossMark visual QA + gold-shadow reconcile remaining).
- Open: #20 (Phase 4 IA blocker), #30 (counter habit — user call), #33 (3-4 items left).
- Discovered: none new.

## Merged this iter
- PR #63 (iter-012 — progress sticker cells + CrossMarkEarned) — CR check green, squash-merged. CR's actionable legend-mirror finding folded into this iter (calendar-grid was already being touched for the hoist).

## Wake-up handoff
- **Current phase:** Earned transition — Phase 2 progress almost done.
- **Next step:** iter-014 picks remaining #33 items. Identity card + per-habit sparkline are independent enough to fat-iter if they touch disjoint files; otherwise sequential. Recommend identity card first (smaller, sets the pattern for "handwritten prose on cream paper"). Then sparkline.
- **Files to open first:** `app/(dashboard)/dashboard/progress/page.tsx` (find identity-card section — search "identity" or "IdentityCard"), per-habit sparkline component (likely `components/progress/per-habit*`).
- **Open questions:** counter habit interaction model (#30) — still parked.
- **Carry-forward:** none. state.json iter `12 → 13`, latest.md → iter-013.md.
- **Scheduled:** 900s — impl iter + design-review buffer.

## Push: ok — branch pushed when PR opened.
