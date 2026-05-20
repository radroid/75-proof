# iter-008 — Phase 2 settings restyle: hand-drawn icons + theme-card sticker shadow

**Branch:** `earned/phase2-settings-icons` → PR into `ux-refresh-simplified-challenge-driven`
**Scope:** 2 of remaining 3 #32 sub-items (icons + sticker shadow). Item (4) handwritten row values still deferred to iter-009.

## Shipped
- **`components/earned/icons/`** (new) — hand-drawn Earned-brand SVG variants for 4 prominent CardHeader icons: `PaletteEarned`, `CalendarDaysEarned`, `BellEarned`, `ShieldEarned`. Each is 1.7px stroke, round caps/joins, slight rotation (-2° / -1° / +2° / -2°) for hand-placed feel. Shield gains an interior checkmark for set cohesion (post-design-review nit).
- **`ThemedIcon` wrapper** (`components/earned/icons/themed-icon.tsx`) — accepts a `name` prop, picks the Earned variant when `useThemePersonality() === "earned"`, falls through to the Lucide default otherwise. Keeps arctic/broadsheet/military/zen visual language untouched.
- **`app/(dashboard)/dashboard/settings/page.tsx`** — 4 CardHeader icon sites swapped: Palette (Theme L368), CalendarDays (Challenge length L530), Shield (Privacy & Sharing L687), Bell (Notifications L781). Lucide imports trimmed.
- **Theme-card sticker shadow** — added `data-earned-card="theme"` attribute to the Theme card; CSS rule under `[data-theme="earned"]` applies `box-shadow: 3px 3px 0 var(--earned-ink)`. Distinguishes the highest-discovery card from the rest of the page.

## Verified
- `npx next build` passes (19 static pages, no type errors).
- **Class A design-review verdict: APPROVE_WITH_FOLLOWUPS.** Confirmed iconography compliance (stroke width within 1.5–2px spec, round caps/joins, visual consistency across the set), non-Earned safety (Lucide fallback intact), no shadow/border conflict (box-shadow composes outside the 1.5px border from iter-006), and hierarchy reads correctly. Reviewer caught a comment-drift bug ("1.5px" said but code was 1.7px) and a shield-icon cohesion nit (no interior detail) — both fixed before commit.

## Deferred to iter-009
- (4) **handwritten row VALUES** via Caveat on settings k/v content (Challenge length card is the best candidate).
- (5) Remaining Lucide → hand-drawn swaps: AlertTriangle, InfinityIcon, Play, Settings, Smartphone, Monitor, Trash2 (7 icons still leaking default stroke under Earned).
- Bundle-size tracking note: ThemedIcon ships both Lucide and Earned variants regardless of active theme. Acceptable at 4 icons; revisit if the variant list grows past ~10.

## Backlog status
- Closed: none — #32 stays in_progress with item (4) + (5) tail still open.
- Open: #20 (Phase 4 IA blocker), #30 (counter habit — user call), #32 (~2/5 items left).

## Merged this iter
- PR #58 (iter-007 — EarnedRow primitive + Caveat page header) — CR + Workers Build green, squash-merged.

## Wake-up handoff
- **Current phase:** Earned transition — Phase 2 surface restyle closing out.
- **Next step:** iter-009 wraps up #32 — finish the remaining 7 Lucide → hand-drawn icon swaps + ship item (4) handwritten row values on the Challenge length card (good k/v candidate: "Started", "Length", "Mode"). After iter-009 closes #32, Phase 2 settings is done — next phase candidates: `/dashboard/progress` (Phase 2 L surface — bigger lift), `/dashboard/coach` (L), or the Phase 1 motion polish backlog.
- **Files to open first:** `components/earned/icons/` (add 7 more variants — alert-triangle, infinity, play, settings, smartphone, monitor, trash), `app/(dashboard)/dashboard/settings/page.tsx` (Challenge length card around L520-670 for handwritten value treatment).
- **Open questions:** counter habit interaction model (#30) — still parked.
- **Carry-forward:** state.json iter `7 → 8`, latest.md → iter-008.md (bundled in this commit).
- **Scheduled:** 900s — impl iter + design-review buffer.

## Push: ok — branch pushed when PR opened.
