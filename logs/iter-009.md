# iter-009 — Phase 2 settings restyle: #32 closure

**Branch:** `earned/phase2-settings-final` → PR into `ux-refresh-simplified-challenge-driven`
**Scope:** Last 3 sub-items of #32 — 7 hand-drawn icons + handwritten value treatment + dynamic-dispatch refactor. Closes #32.

## Shipped
- **7 hand-drawn icons** added under `components/earned/icons/`: `AlertTriangleEarned`, `InfinityEarned`, `PlayEarned`, `SettingsGearEarned`, `SmartphoneEarned`, `MonitorEarned`, `TrashEarned`. Same stroke discipline as iter-008 (1.7px, round caps/joins, rotations in [-2°, +2°]).
- **ThemedIcon variant map** extended to 11 entries; `index.ts` barrel updated. Bundle adds 11 Lucide + 11 Earned modules — tree-shaken; defer dynamic import until ~30 entries (per design-review).
- **Settings page Lucide-free** — all 11 use-sites now route through `<ThemedIcon name=… />`. Removed the entire lucide-react import block from `app/(dashboard)/dashboard/settings/page.tsx`. The dynamic Smartphone/Monitor dispatch refactored from `const PlatformIcon = … ? Monitor : Smartphone` to a typed `platformIconName` literal const + `<ThemedIcon name={platformIconName} />` (no behavior change, type-safe via `as const`).
- **Handwritten value treatment** — new `data-earned-value` attribute on "protagonist number" `<p>` elements (Habit tracker mode label + Day N of M counter on the Challenge length card). CSS rule under `[data-theme="earned"]`: Caveat 1.5rem, weight 600. Other themes unaffected.

## Verified
- `npx next build` passes (19 static pages, no type errors).
- **Class A design-review verdict: APPROVE_WITH_FOLLOWUPS.** Confirmed iconography coherence across all 11 icons, no Lucide leak in settings/page.tsx (`grep lucide-react` returns nothing), `data-earned-value` correctly gated under `[data-theme="earned"]`, dynamic dispatch refactor preserves type-narrowing, bundle hygiene OK at this scale. No blockers.

## Follow-ups noted (non-blocking, no tasks created)
- Trash icon interior detail slightly busier than the set at h-4/w-4 (lid+handle+2 ticks vs. siblings' 1-2 marks).
- Settings gear silhouette is a single 16-vertex polyline rather than discrete tooth-loops; reads more crystalline than wobbly — softer cubic on the teeth would feel more hand-drawn.
- "Habit tracker mode" label at Caveat 1.5rem may dwarf the sub-copy on narrow widths; designer eyeball before generalizing the `data-earned-value` pattern further.

## Backlog status
- Closed: **#32** (full settings restyle to MeScreen feel). Phase 2 settings is done.
- Open: #20 (Phase 4 IA blocker), #30 (counter habit — user call).
- Discovered: none new.

## Merged this iter
- PR #59 (iter-008 — first 4 hand-drawn icons + theme-card sticker shadow) — CR + Workers Build green, squash-merged.

## Wake-up handoff
- **Current phase:** Earned transition — Phase 2 settings closed. Phase 2 continues with bigger surfaces (`/progress`, `/coach`, `/onboarding`) or Phase 1 motion polish on EarnedDashboard.
- **Next step:** Pick from: (a) `/dashboard/progress` Earned restyle (L surface — big lift, biggest visible delta), (b) Phase 1 motion polish on the EarnedDashboard checkbox (ink stroke draw + paper-crinkle scale + gold-star pop — multiple small wins), (c) `/dashboard/coach` (L surface). Recommendation: Phase 1 motion polish since it improves the most-used surface and lands incrementally; defer Phase 2 L surfaces until motion is dialed.
- **Files to open first:** `components/themes/earned-dashboard.tsx` for motion polish; or `app/(dashboard)/dashboard/progress/page.tsx` for the bigger restyle.
- **Open questions:** counter habit interaction model (#30) — still parked.
- **Carry-forward:** state.json iter `8 → 9`, latest.md → iter-009.md (bundled in this commit).
- **Scheduled:** 900s — impl iter + design-review buffer.

## Push: ok — branch pushed when PR opened.
