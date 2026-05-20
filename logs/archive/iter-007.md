# iter-007 — Phase 2 settings restyle: EarnedRow + page-header treatment

**Branch:** `earned/phase2-settings-mescreen` → PR into `ux-refresh-simplified-challenge-driven`
**Scope:** 2 features from #32 (out of 5): EarnedRow primitive + Caveat page-header treatment.

## Shipped
- **EarnedRow primitive** (`components/earned/earned-row.tsx`, exported via barrel) — k/v row matching MeScreen pattern: padding 10px 0, dashed cream-dark bottom border, Poppins 13px muted label, Caveat 20px ink-600 value, optional `action` slot. Documented the action slot's inline-flex constraint after design-review feedback.
- **Page header treatment under Earned** — added `data-slot="page-title"` and `data-slot="page-description"` to `components/layout/page-container.tsx`'s PageHeader, then CSS overrides in `app/globals.css` under `[data-theme="earned"]`: title → Caveat 2.5rem at line-height 1.05 (descender clearance), description → Poppins 13px muted ink. Applies to every page using PageHeader without per-route work.
- **Preferences card restructure** (`app/(dashboard)/dashboard/settings/page.tsx`) — removed the inner `space-y-5` wrapper so Haptics + Water Unit are direct children of CardContent. The iter-006 dashed-row rule now fires between them under Earned. Added explicit `mt-5` on Water Unit to preserve the 1.25rem vertical rhythm on non-Earned themes (Tailwind's specificity is lower than my Earned rule's, so the override still wins under Earned).

## Verified
- `npx next build` passes (19 static pages, no type errors).
- **Class A design-review verdict: APPROVE_WITH_FOLLOWUPS.**
  - Visual fidelity confirmed against MeScreen reference (`design-system/project/ui_kits/earned-ios/screens.jsx` L211-245).
  - AA contrast pass on page-description (~5.6:1 against cream).
  - Scope correctly gated to `[data-theme="earned"]`; non-Earned typography untouched.
  - **Caught and fixed** a non-Earned-theme spacing regression in Preferences (removed wrapper meant arctic/broadsheet/military/zen would lose the 1.25rem gap). Mitigated with explicit `mt-5` on the second child + line-height fix on page-title (1 → 1.05) for Caveat descenders.

## Deferred to iter-008 (still under #32)
- (3) Theme switcher card sticker shadow.
- (4) Handwritten row VALUES via Caveat on other settings sections.
- (5) Lucide → hand-drawn icon swap (Palette / CalendarDays / Play / etc.).
- Wire EarnedRow into Preferences card (primitive landed ahead of full consumer — Preferences uses interactive controls, not pure k/v, so EarnedRow lands cleanest in Stars/Me screens once those exist).

## Backlog status
- Closed: none — #32 stays open since 3 of 5 sub-items remain.
- Open: #20 (still blocked on Phase 4 IA), #30 (counter habit — user call), #32 (3/5 items left).
- Discovered: none new.

## Merged this iter
- PR #57 (iter-006 — settings CSS-overlay baseline) — APPROVED + CR + Workers Build green, squash-merged.

## Wake-up handoff
- **Current phase:** Earned transition — Phase 2 surface restyle continues.
- **Next step:** iter-008 picks the remaining 3 sub-items from #32. Most-impactful next: (5) Lucide icon swap — visible across every Card with an icon header (Theme/Tour/Profile/Preferences/Challenge/Privacy/Notifications). Then (3) theme-card sticker-shadow surround. (4) handwritten values is the smallest delta — pair with (3) if iter has budget.
- **Files to open first:** `components/icons/` (create if missing — for hand-drawn variants), `app/(dashboard)/dashboard/settings/page.tsx` (icon usage in CardHeader), `design-system/project/preview/components-buttons.html` (visual ref for hand-drawn line style).
- **Open questions:** counter habit interaction model (#30) — still parked.
- **Carry-forward:** `.loop/state.json` iter `6 → 7` + `latest.md` → `iter-007.md` need to happen — bundling in this commit since no PRs conflict.
- **Scheduled:** 900s — impl iter + design-review buffer.

## Push: ok — branch pushed when PR opened.
