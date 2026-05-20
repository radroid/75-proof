# iter-011 — Phase 2 /dashboard/progress restyle (first cut)

**Branch:** `earned/phase2-progress-first-cut` → PR into `ux-refresh-simplified-challenge-driven`
**Scope:** First cut of progress page Earned restyle — headline metric tiles + calendar grid. Heatmap, identity card, per-habit sparkline deferred to iter-012 (task #33).

## Shipped
- **HeadlineMetrics tiles** (`components/progress/headline-metrics.tsx`) — added `data-earned-tile="metric"` attribute to both tiles. CSS rule in `app/globals.css` under `[data-theme="earned"]` applies cream-light bg + 1.5px ink border + 2px sticker shadow. The big numbers already use `var(--font-heading)` (resolves to Caveat under Earned) — the rule just dresses the container to match.
- **CalendarGrid Earned variant** (`components/progress/calendar-grid.tsx`) — conditional rendering via `useThemePersonality()`. Earned days carry a small gold `Star size={18}` icon; today is a sky-ringed cell with handwritten day number; missed days a small red X (Lucide for now — flagged for iter-012); future cells a faint dashed cream-dark border. Non-Earned themes unchanged. Legend signature widened to accept either a `swatchClass` (existing) or `swatch` ReactNode (for Earned brand glyphs).

## Verified
- `npx next build` passes (19 static pages, no type errors).
- **Class A design-review verdict: APPROVE_WITH_FOLLOWUPS.** Confirmed cascade correctness (the new data-attribute rule is a bare CSS rule, beats Tailwind `@layer utilities` regardless of specificity), no touch-target compression (cells are `cursor-default`, no handler), Star size 18px in 20px mobile cell doesn't clip, X-on-cream contrast ≈ 3.5:1 passes WCAG 3:1 for non-text graphics. Non-Earned default path untouched — diff is purely additive behind `isEarned`.

## Reference-fidelity gap (logged as #33)
Reviewer surfaced a real divergence from `design-system/project/ui_kits/earned-ios/screens.jsx` StarsScreen. The reference treats earned cells as *filled stickers* (gold-fill + ink border — the cell IS the sticker), today as *sky-filled with cream-light digit*, and missed as *rose border + `·`*. iter-011 ships icon-on-paper (gold Star floating in cream cell, sky ring around ink digit, Lucide X). Defensible as a first cut — the 15-col 75-day layout can't borrow the reference's 7-col cell rhythm directly — but the sticker treatment is what makes the page read as "stickers stuck to the page". Captured as task #33's item 1.

## Backlog status
- Closed: none (iter-011 is a baseline, not the full progress restyle).
- Open: #20 (Phase 4 IA blocker), #30 (counter habit), #33 (progress iter-012 — discovered this iter).
- Discovered: #33.

## Merged this iter
- PR #61 (iter-010 — decade rollup + Phase 1 motion polish: HandCheckbox tick animation + StarBurst celebration) — CR + Workers Build green, squash-merged.

## Wake-up handoff
- **Current phase:** Earned transition — Phase 2 progress page continues.
- **Next step:** iter-012 picks #33 — the 5 sub-items will likely span 1-2 iters. Highest-impact first: (1) cell-fill rework so earned days become the gold-ink stickers from the reference; (2) hand-drawn rose mark for missed days (per iconography rule — Lucide X violates "no Lucide defaults in Earned"); then identity card + sparkline.
- **Files to open first:** `components/progress/calendar-grid.tsx`, `components/earned/icons/` (add a `cross-mark` or similar variant), `design-system/project/ui_kits/earned-ios/screens.jsx` StarsScreen.
- **Open questions:** counter habit interaction model (#30) — still parked.
- **Carry-forward:** none. state.json iter `10 → 11`, latest.md → `iter-011.md`.
- **Scheduled:** 900s — impl iter + design-review buffer.

## Push: ok — branch pushed when PR opened.
