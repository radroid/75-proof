# iter-012 — Phase 2 progress restyle: sticker cells + hand-drawn cross mark

**Branch:** `earned/phase2-progress-stickers` → PR into `ux-refresh-simplified-challenge-driven`
**Scope:** 2 of #33's 6 items — cell-fill rework + hand-drawn rose mark. Heatmap, identity card, sparkline, lookup-table hoist, gold-shadow reconciliation deferred to iter-013+.

## Shipped
- **CalendarGrid cell-fill rework** (`components/progress/calendar-grid.tsx`) — under `[data-theme="earned"]`, each cell IS the sticker now. Earned: gold fill + 1.5px ink border + 2px ink sticker shadow, no inset glyph. Today: sky fill + cream-light digit + ink border + 2px sticker shadow. Missed: 1.5px ink-rose border + small hand-drawn cross mark inside. Future: dashed cream-dark border, faint muted digit. Legend swatches use the same fill/border recipe as their cells so the legend mirrors what the page renders.
- **`CrossMarkEarned` icon** (`components/earned/icons/cross-mark.tsx`, new) — two short ink strokes crossed through cell centre, strokeWidth 2, transform `rotate(-2deg)`. Per design-system §Iconography pt 2: hand-drawn over Lucide. Exported via barrel.
- Removed Lucide `X` import from `calendar-grid.tsx`; only `Check` remains for the non-Earned branch.

## Verified
- `npx next build` passes (19 static pages).
- **Class A design-review verdict: APPROVE_WITH_FOLLOWUPS.** Confirmed reference fidelity (gold/sky/rose cells match StarsScreen at L150-205), AA contrast on cream-light digit over sky background ≈ 5.1:1 (passes), CrossMark stroke at h-3 12px renders ~1px effective (legible but at floor — flagged as iter-013 QA). Non-Earned themes untouched; conditional preserved.

## Intentional drift from reference
- StarsScreen reference uses FLAT gold cells (no sticker shadow); iter-012 adds 2px ink shadow to gold cells too. Creates visual parity with today (both stickered) at the cost of reference fidelity. Defensible either way; logged as iter-013 reconcile item.
- StarsScreen uses a small middle-dot (`·`) for missed-day mark; iter-012 uses CrossMarkEarned. Justified by README §Iconography pt 2 (hand-drawn over geometric/unicode) — an intentional upgrade.

## Backlog status
- Closed: none (#33 still in_progress with 4 sub-items + 2 new iter-013 items).
- Open: #20 (Phase 4 IA), #30 (counter habit — user call), #33 (4 of 6 items left).
- Discovered: 2 iter-013 items added to #33 (style lookup-table hoist, gold-shadow reconciliation).

## Merged this iter
- PR #62 (iter-011 — progress first cut) — CR + Workers Build green, squash-merged.

## Wake-up handoff
- **Current phase:** Earned transition — Phase 2 progress page continues.
- **Next step:** iter-013 picks #33's biggest remaining item: heatmap (ink-density variant). That alone may be a full iter. Pair with the small lookup-table hoist as prep work (touches the same file). Defer identity card + sparkline + small QA items.
- **Files to open first:** `app/(dashboard)/dashboard/progress/page.tsx` (find the heatmap section — likely 90+ day fallback), `components/progress/calendar-grid.tsx` (existing cell logic to mirror), `design-system/project/preview/components-calendar.html` (visual ref if heatmap doesn't have its own).
- **Open questions:** counter habit interaction model (#30) — still parked.
- **Carry-forward:** none. state.json iter `11 → 12`, latest.md → iter-012.md.
- **Scheduled:** 900s — impl iter + design-review buffer.

## Push: ok — branch pushed when PR opened.
