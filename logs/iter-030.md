# iter-030 — CalendarClockEarned variant + ChallengeUpcoming swap + blocks.md sync

**Branch:** `earned/iter030-calendar-clock-and-blocks` → PR base `ux-refresh-simplified-challenge-driven`. Single PR. Branched off integration tip post-PR-#80-merge (`4685af5`).

**Scope:** one new hand-drawn variant + the most brand-visible non-coach pre-Day-1 surface + sync the iter-029 followups into the canonical `logs/blocks.md` now that PR #80 has landed.

## Merge events this iter

- **PR #80 merged** (`gh pr merge 80 --squash --delete-branch`) — iter-028 Phase 9 prep + non-coach Lucide swaps (Trophy/Infinity/RefreshCcw/X) + the new `logs/blocks.md` log. APPROVED + CLEAN + all checks SUCCESS. Auto-merge was previously denied by the classifier (iter-028, iter-029 wake-ups) for "no explicit user authorization"; the iter-030 prompt explicitly authorized the merge, so it landed this iter.
- **PR #81 left open** — iter-029 CheckEarned + theme-switcher swap + metadata voice unification. CR cleared (`state: SUCCESS`) but `reviewDecision` is still empty, so per the workflow it sits until radroid (or the next iter's prompt) approves it. Mergeability flipped to `UNKNOWN` after PR #80 landed because GitHub hasn't re-evaluated; will probably need a small rebase to absorb the new integration tip.

## Shipped

- **`components/earned/icons/calendar-clock.tsx`** (NEW) — `CalendarClockEarned` hand-drawn variant. Calendar page in top-left (wobbly outline + binding line + tab marks — vocabulary matches `CalendarDaysEarned`) with the right edge intentionally truncated so a small clock ring (`r=4.4`, hands at 12 + 3) nests cleanly into the bottom-right corner. `strokeWidth=1.7`, `rotate(-1.5deg)`. Class A reviewer ratified the design at 24px display size as a marginal-but-legible composition consistent with the broader Earned icon system.
- **`components/earned/icons/themed-icon.tsx`** — added `CalendarClock` Lucide import, `CalendarClockEarned` import from `./calendar-clock`, `"calendar-clock"` entry in the `IconName` union, and a `"calendar-clock": { lucide: CalendarClock, earned: CalendarClockEarned }` variant-map entry with a 5-line explanatory comment.
- **`components/challenge-upcoming.tsx`** — pre-Day-1 hero icon (h-6 w-6 inside a 48px `bg-primary/10` chip atop the countdown surface) swapped from Lucide `CalendarClock` → `<ThemedIcon name="calendar-clock" />`. Lucide import removed. The old `aria-hidden="true"` JSX attribute was dropped; reviewer confirmed via `node_modules/lucide-react/dist/esm/Icon.js` line 32 that `lucide-react` v0.562.0 auto-applies `aria-hidden="true"` to every icon that has no children + no a11y prop, so non-Earned themes still announce correctly. The Earned variant declares `aria-hidden="true"` directly on its SVG. No a11y regression.
- **`logs/blocks.md`** — sync pass:
  - Marked iter-028 survey's `check` and `calendar-clock` line items as **resolved iter-029 / iter-030** with PR references.
  - Added new "From iter-029 design-review" section capturing the two non-blocking followups Class A flagged on iter-029: extend `ThemedIcon` with optional `strokeWidth?: number` prop (forward only to the Lucide branch), and visual smoke test the thinner selected-tick on arctic / broadsheet / military / zen.

## Verified

- `npx next build` passes (19 static pages, no type errors).
- Class A `feature-dev:code-reviewer` design-review dispatched. Verdict: **APPROVE-WITH-FOLLOWUPS**.
- Reviewer corrected one factual claim in my dispatch brief: I asserted Lucide does NOT auto-apply `aria-hidden`; reviewer verified via Lucide source (Icon.js L32) that it DOES auto-apply when no a11y prop is present. No actual regression — just a doc-accuracy nit for the next iter to fold into the `ThemedIcon` comment block.

## Open backlog

- `#20` (Phase 4 IA blocker) — user-blocked.
- `#30` (counter habit interaction model) — user-blocked.
- **Phase 9 main-merge gate** — user-blocked.

## Followups from this iter

Captured into `logs/blocks.md`:

1. **Bundle the iter-029 `strokeWidth` forwarding extension with the next icon swap.** Two non-blocking items (the prop extension + the cross-theme smoke test of the thinner tick) have a natural landing point together — pick them up before more icon work accumulates.
2. **Add a corrective note to `ThemedIcon`'s comment block** stating that Lucide v0.562+ auto-applies `aria-hidden` when no a11y prop is set, so swap sites can safely drop their JSX-level `aria-hidden`. Doc-only; takes 30 seconds.
3. **Eyeball the clock-in-corner legibility at actual 24px display** in dev mode before Phase 9 lands on main. `r=4.4` ring is near the lower bound of hand-drawn detail at this rendered size; the reviewer marked this acceptable but worth a manual check.

## Wake-up handoff

- **Current phase:** Earned transition — integration mature; Phase 9 main-merge gate is the next material event.
- **PRs in flight:** **PR #81** (iter-029 CheckEarned + metadata voice — CR cleared, awaiting user review + potential small rebase), **PR #<this iter>** (iter-030 CalendarClock).
- **Next step (iter-031):** (1) check both PRs' status; if #81 is CR-cleared, CLEAN/MERGEABLE/APPROVED → merge it; rebase #<this iter> against fresh integration if needed. (2) `logs/blocks.md` user-block scan. (3) if no user resolutions, pick: (a) extend `ThemedIcon` with `strokeWidth?: number` forwarded only to the Lucide branch + restore `strokeWidth={3}` at the theme-switcher call site (this iter's followup #1 + iter-029 followup #1 — natural pairing); (b) add corrective `aria-hidden` doc note to `ThemedIcon` comment block (followup #2 — 30s); (c) audit `app/(dashboard)/dashboard/page.tsx` + EarnedDashboard's residual Lucide imports for next-most-visible swap; (d) Phase 10 `/design-system` dev-only route.
- **Files to open first:** `logs/blocks.md`, `components/earned/icons/themed-icon.tsx`, `components/theme-switcher.tsx`.
- **Carry-forward:** state.json iter `28 → 30`. The iter-029 branch holds the iter-29 bump that hasn't merged yet; this branch bumps direct to 30. Once #81 merges, the state.json on integration will jump 28 → 29 → 30 in two squash commits.
- **Scheduled:** 1800s — same reasoning as iter-028/029 (work is shallow pending user decisions; longer cadence matches).

## Push: ok — branch pushed when PR opened.
