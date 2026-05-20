# iter-006 — Phase 2 settings restyle (CSS-overlay baseline)

**Branch:** `earned/phase2-settings-restyle` → PR into `ux-refresh-simplified-challenge-driven`
**Scope:** 1 feature (CSS-only) — pragmatic baseline restyle for `/dashboard/settings` under the Earned theme. Full MeScreen-feel rewrite deferred to iter-007 with concrete task #32.

## Shipped
- `app/globals.css` — new block under `[data-theme="earned"]` (after the paper-ruled utilities, before the global layout tokens) adding:
  - `[data-slot="card-title"]` → Caveat (heading font), tightened letter-spacing + line-height.
  - `[data-slot="card-title"].text-lg` → 1.75rem (Caveat reads ~25% smaller than Poppins at the same numeric size, so bump to keep the section header dominant).
  - `[data-slot="card-description"]` → muted ink at `rgba(31,31,29,0.65)` (AA-pass on cream-light: ~5.0:1).
  - `[data-slot="card"]` → 1.5px ink border (matches the design rule for hand-trembled card outlines without going to SVG).
  - `[data-slot="card-content"] > * + *` → dashed cream-dark separators between direct children, mimicking notebook page rows.
- No JSX touched — the settings page's 1158 lines stay as-is. Override applies globally to all shadcn Card uses under Earned (settings, progress, etc.). The EarnedDashboard inlines its own visuals and is unaffected.

## Verified
- `npx next build` passes (19 static pages, no type errors, no CSS warnings).
- **Class A design-review sub-agent** verdict: `APPROVE_WITH_FOLLOWUPS`. Confirmed scope isolation (no leak to arctic/broadsheet/military/zen), AA contrast pass, no touch-target compression, and reasonable hierarchy vs PageHeader.
- Screenshot via Playwright **skipped** — `/dashboard/settings` is auth-gated; getting past Clerk sign-in to the rendered page is more flake than signal. Substituted the Class A reviewer per the "Frontend has no free signal" rule.

## Soft spot (logged for iter-007)
The dashed-row rule only fires when `CardContent` has multiple direct children. Most settings cards wrap their content in a single `<div className="space-y-*">`, so the signature notebook-row dashes don't appear on most cards. Real fidelity to MeScreen needs the JSX-level changes captured in task **#32**.

## Backlog status
- Closed: none (iter-006 is a baseline, not the full task).
- Open: #20 (still blocked on Phase 4 IA), #30 (counter habit — needs user call), #32 (full settings restyle — discovered this iter).
- Discovered: #32.

## Merged this iter
- PR #56 (iter-005 Phase 5 voice migration) — CR + Workers Build green, squash-merged.

## Wake-up handoff
- **Current phase:** Earned transition — Phase 2 surface restyle continues.
- **Next step:** Pick #32 (full settings MeScreen restyle) — the 5 sub-items there will likely span 1-2 iters. Start with the EarnedRow primitive + page-header treatment since those land the most visible delta.
- **Files to open first:** `app/(dashboard)/dashboard/settings/page.tsx`, `design-system/project/ui_kits/earned-ios/screens.jsx` (MeScreen), `components/earned/` (extracted primitives — add EarnedRow here).
- **Open questions:** counter habit interaction model (#30) — still parked.
- **Carry-forward:** none — bookkeeping caught up this commit (state.json iter `4 → 6`, latest.md repointed `iter-002.md → iter-006.md`, skipping iter-3 and iter-5 markers since those PRs deliberately didn't touch bookkeeping).
- **Scheduled:** 900s — impl iter + design-review buffer.

## Push: ok — branch pushed when PR opened.
