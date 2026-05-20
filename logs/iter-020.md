# iter-020 — decade rollup + /dashboard/coach first cut

**Branch:** `earned/phase2-coach-first-cut` → PR into `ux-refresh-simplified-challenge-driven`
**Scope:** Decade-rollup bookkeeping + coach composer Earned chrome. iter-021+ continues coach via #37.

## Shipped
- **Decade rollup** — `logs/iter-010.md` through `iter-019.md` moved to `logs/archive/`. New `logs/summary-011-019.md` is the canonical second-decade handoff: closed-task index per iter + key decisions (cell-IS-sticker progress pattern, first-person voice cascade, brand Star as reward currency at every semantic, 20-icon ThemedIcon set, universal focus-ring outline) + design-review patterns (8/9 APPROVE_WITH_FOLLOWUPS, 1 BLOCK on the branch-reset lost-edit hazard).
- **CoachComposer chrome** (`components/coach/CoachComposer.tsx`) — `data-earned-composer` attribute on the form, `data-earned-input` on the textarea.
- **CSS rules** (`app/globals.css`):
  - `[data-theme="earned"] [data-earned-composer]` → cream-light bg, 1.5px ink border, 2px ink sticker shadow.
  - `[data-theme="earned"] [data-earned-composer] [data-earned-input]` → strips the textarea's own bg + border so it inherits the composer's surface (overrides iter-018's input recipe specifically when nested in a composer).

## Verified
- `npx next build` passes.
- **Class A design-review verdict: APPROVE_WITH_FOLLOWUPS.** Cascade math confirmed (nested override at (0,3,0) beats outer at (0,2,0)). Composer cream-paper composition reads correctly; opaque cream-light makes `backdrop-blur` a no-op (acceptable for paper feel). Reviewer surfaced 6 follow-ups captured as task #37 (bubble per role, recents sheet, history icon, page-header decision, sticker shadow at narrow widths, focus-ring scope on composer).

## Discovered this iter
- **#37** — coach iter-021+ continuation (8 sub-items from the reviewer + EARNED_TRANSITION.md Phase 2 § /coach).
- **#36** — revisit /offline + 404 pages under current Earned conventions (user request mid-iter).

## Backlog status
- Closed: none new this iter.
- Open: #20 (Phase 4 IA blocker), #30 (counter habit), #36 (offline + 404 refresh — NEW), #37 (coach iter-021+ — NEW).

## Merged this iter
- PR #70 (iter-019 — friends polish; closed #35) — APPROVED, squash-merged.

## Wake-up handoff
- **Current phase:** Earned transition — Phase 2 surfaces ≈70% done (Today / Settings / Progress / Friends shipped; Coach first cut; Onboarding / auth / landing / error pages still pending).
- **Next step:** iter-021 picks one of: (a) **#36** offline + 404 refresh + error.tsx — clean small surfaces, good for closing the "every page reads Earned" target; (b) **#37** coach continuation — bubble styling + recents sheet + page header decision. Recommendation: ship #36 first (small, knocks off three more surfaces) then iter-022 picks #37.
- **Files to open first (for #36):** `app/offline/page.tsx`, `app/(dashboard)/dashboard/_not-found.tsx` or `app/not-found.tsx`, `app/error.tsx`.
- **Open questions:** counter habit interaction model (#30) — still parked.
- **Carry-forward:** none. state.json iter `19 → 20`, latest.md → iter-020.md.
- **Scheduled:** 900s — impl iter + design-review buffer.

## Push: ok — branch pushed when PR opened.
