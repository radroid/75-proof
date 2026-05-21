# iter-029 — CheckEarned hand-drawn variant + theme-switcher swap + metadata voice unification

**Branch:** `earned/iter029-check-and-meta` → PR base `ux-refresh-simplified-challenge-driven`. Single PR. Branched off integration tip (`61a1437`) — PR #80 (iter-028 Phase 9 prep) is still open + approved but the auto-merge classifier denied the squash this iter, so this iter's work runs alongside.

**Scope:** two mop-up items from the iter-028 handoff — (a) hand-drawn `Check` variant + theme-switcher swap, and (b) `Build the streak` → `Earn the star` voice unification across `app/layout.tsx` metadata + `app/manifest.ts` so the SEO/manifest copy matches the iter-027 landing tagline.

## Shipped

- **`components/earned/icons/check.tsx`** (NEW) — `CheckEarned` hand-drawn checkmark. Single SVG path, `strokeWidth=2`, round caps, `rotate(-2deg)`, endpoints nudged off-grid (`5.4,12.2 → 9.8,17 → 18.6,7.4`) so the glyph reads as drawn-by-hand rather than collapsing to a mathematically perfect tick at 14px. Cadence matches `CrossMarkEarned` + `PlusEarned`.
- **`components/earned/icons/themed-icon.tsx`** — added `Check` import from Lucide, `CheckEarned` import from `./check`, `"check"` entry in the `IconName` union, `check: { lucide: Check, earned: CheckEarned }` variant-map entry with a 3-line explanatory comment.
- **`components/theme-switcher.tsx`** — Lucide `Check` import removed; selected-state badge tick now renders via `<ThemedIcon name="check" className="h-3.5 w-3.5 text-primary-foreground" />`. **Known trade-off:** the old call used `strokeWidth={3}` for a bold selected-tick; `ThemedIcon` doesn't currently forward `strokeWidth`, so non-Earned themes now render at Lucide's default `strokeWidth=2`. Class A reviewer rated this an acceptable polish loss (still legible at 14px on the high-contrast gold disc) but logged a follow-up to extend `ThemedIcon` with an optional `strokeWidth` prop (forwarded only to the Lucide branch; the Earned variant owns its own weight).
- **`app/layout.tsx`** — four occurrences of `"Show up. Every day. Build the streak."` unified to `"Show up. Every day. Earn the star."` (metadata.description, openGraph.description, twitter.description, JSON-LD `SoftwareApplication.description`).
- **`app/manifest.ts`** — same string unified in the PWA manifest description so install-prompt + app-store-style surfaces match.

## Verified

- `npx next build` passes (19 static pages, no type errors).
- `grep "Build the streak" components/ app/` returns empty.
- `grep "from \"lucide-react\"" components/theme-switcher.tsx` returns empty (clean Lucide removal).
- Class A `feature-dev:code-reviewer` design-review subagent dispatched. Verdict: **APPROVE-WITH-FOLLOWUPS** (two non-blocking polish items below).

## Open backlog

- `#20` (Phase 4 IA blocker) — user-blocked. See `logs/blocks.md` (will be on integration once PR #80 lands).
- `#30` (counter habit interaction model) — user-blocked. Same.
- **Phase 9 main-merge gate** — user-blocked. Same.

## Followups from this iter (sync into `blocks.md` after PR #80 lands)

These were ratified non-blocking by Class A review but worth tracking:

1. **Extend `ThemedIcon` with optional `strokeWidth?: number` prop**, forwarded only to the Lucide branch (the Earned variants intentionally own their own stroke weight). Restore `strokeWidth={3}` at the `theme-switcher.tsx` call site to recover the original bold selected-tick weight on arctic/broadsheet/military/zen. Currently the non-Earned themes lose ~0.6px of rendered stroke at 14px display.
2. **Visual smoke test on all four non-Earned theme cards** after the Earned merge — confirm the thinner tick (1.17px rendered) still reads clearly inside the gold disc on arctic / broadsheet / military / zen previews before Phase 9 lands on main.

## Wake-up handoff

- **Current phase:** Earned transition — integration mature; Phase 9 main-merge gate is the next material event.
- **PRs in flight:** **PR #80** (iter-028 — APPROVED + CLEAN, awaiting user-supervised merge), **PR #<this iter>** (iter-029).
- **Next step (iter-030):** (1) check PR #80 + PR #<this iter> merge status. (2) check `logs/blocks.md` for any user resolution on #20 / #30 / Phase 9 gate. (3) if blocks.md just landed via PR #80, sync the two iter-029 followups into the design-review section. (4) candidate mop-up: ChallengeUpcoming `CalendarClock` swap (needs new `calendar-clock` variant — hand-drawn calendar with clock overlay; small new icon), Phase 10 `/design-system` dev-only route, or extend `ThemedIcon` with `strokeWidth` per followup #1 above.
- **Files to open first:** `logs/blocks.md` (on integration once #80 lands), `components/challenge-upcoming.tsx`, `components/earned/icons/themed-icon.tsx`.
- **Carry-forward:** state.json iter `27 → 29` (skipped 28 because PR #80's branch holds the iter-28 bump; this branch carries 27 → 29 directly).
- **Scheduled:** 1800s — same reasoning as iter-028 (impl work shallow pending user decisions).

## Push: ok — branch pushed when PR opened.
