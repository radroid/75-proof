# iter-021 — Phase 2 error/fallback pages restyle

**Branch:** `earned/phase2-error-pages` → PR into `ux-refresh-simplified-challenge-driven`
**Scope:** 3 surfaces (closes #36). Inline visual tokens — no theme-provider dependency.

## Shipped
- **`app/not-found.tsx`** (rewritten) — full Earned restyle. Cream paper + ruled lines + gold star (rotated -8° to read "slightly off"), 11px 404 caption, Caveat 56px "Page not found", muted body "I can't find this page — let's get back.", sky-blue primary "Back to today" + dashed-border secondary "Home".
- **`app/error.tsx`** (rewritten) — full Earned restyle. Same paper/font pattern, with a rose ink dot at the star's centre ("earned but interrupted"), Caveat 56px "Something broke", body "My progress is safe. Try again, or head back.", sky-blue "Try again" button (calls reset) + dashed-border "Back to today". `error.digest` preserved at the bottom in muted-ink monospace.
- **`app/offline/page.tsx`** — voice tweak only: "today's page will be here when you're back" → "today's page is waiting" (removes "you're", reads more first-person-neutral). Visual unchanged.
- **`app/offline/try-again-button.tsx`** — aligned to the new sky-blue + ink-border + sticker-shadow recipe so all 3 error surfaces share one button language. Reviewer caught the iter-001 coral `#FF6154` drift mid-iter; fixed before commit.

## Verified
- `npx next build` passes (19 static pages, no type errors).
- **Class A design-review verdict: APPROVE_WITH_FOLLOWUPS.** Inline-token coverage confirmed clean (no `--earned-*` vars, no theme-dependent Tailwind classes — all hex direct). Rose dot inside the star reads as "earned-but-interrupted" rather than "deleted/negated" (contrast vs the alternative × overlay). Reviewer also noted optional contrast bump on primary button label (`#F9F3E1` → `#FFFFFF` for cleaner AA Normal, though 16px/600 already qualifies as Large at 4.0:1) and a doc todo for the 56px Caveat carve-out — both deferred.

## Backlog status
- Closed: **#36** (offline + 404 pages refresh; error.tsx + try-again-button aligned).
- Open: #20 (Phase 4 IA blocker), #30 (counter habit — user call), #37 (coach iter-022+ continuation).

## Merged this iter
- PR #71 (iter-020 — decade rollup + coach first cut) — CR + Workers Build green, squash-merged.

## Wake-up handoff
- **Current phase:** Earned transition — error surfaces done. Coach continuation (#37) is the natural next iter; onboarding / auth / landing still pending after that.
- **Next step:** iter-022 picks #37 — biggest remaining sub-items are bubble styling per role (coach vs user) + page-header decision (chromeless vs Caveat title). Recents sheet visual + history icon also queued.
- **Files to open first:** `components/coach/CoachClient.tsx` (find the ChatTurnView render), `components/coach/CoachRecentsSheet.tsx`, `components/earned/icons/themed-icon.tsx` (to add `history` variant).
- **Open questions:** counter habit interaction model (#30) — still parked.
- **Carry-forward:** none. state.json iter `20 → 21`, latest.md → iter-021.md.
- **Scheduled:** 900s — impl iter + design-review buffer.

## Push: ok — branch pushed when PR opened.
