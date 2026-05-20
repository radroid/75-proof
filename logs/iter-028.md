# iter-028 — Phase 9 prep + non-coach Lucide → ThemedIcon swaps

**Branch:** `earned/phase9-prep-iter028` → PR base `ux-refresh-simplified-challenge-driven`.
**Scope:** survey Phase 9 readiness + log the user-decision-blocked items in `logs/blocks.md` + opportunistic ThemedIcon swaps in two visible non-coach surfaces.

## Survey results

Walked through `docs/EARNED_TRANSITION.md`. With #37 (coach Phase 2) just closed, the remaining work splits into three buckets:

1. **User-decision-blocked.** #20 (Phase 4 redirects, blocked on IA), #30 (counter habit, blocked on interaction model), Phase 9 main-merge gate (blocked on product call), plus open product questions (Journal scope, tone calibration, sunset timeline, brand assets, i18n).
2. **Big new builds.** Phase 3 new surfaces (Journal XL, Stars L, "Add habit" modal M) and Phase 4 paper nav. These need design + product alignment to start.
3. **Mop-up.** Phase 7 hand-drawn icon set (43 non-coach Lucide files still import Lucide), Phase 8 A/B experiment plumbing (needs PostHog ops + a run window), Phase 10 `/design-system` route. All shippable but lower priority than landing the existing integration on main.

The integration branch (`ux-refresh-simplified-challenge-driven`) is **mature enough to ship**:
- Phase 1 polish: done bar #30.
- Phase 2 surface restyle: COMPLETE (#22, #32, #33, #34, #35, #36, #37 all closed).
- Phase 5 voice migration: COMPLETE (#16, #18, #23, #29, #31).
- Phase 7 plumbing: COMPLETE (#10, #14, #15, #18, #19, #27, #28). Lucide audit deferred — Trophy/Infinity/RefreshCcw + close-button X swapped this iter; remaining 43 non-coach Lucide files don't need to block ship.
- Phase 10 docs: COMPLETE (#24, #25, #26).

**The Phase 9 main-merge gate is the next material thing**, and it's a user call (see `logs/blocks.md`).

## Shipped

- **`logs/blocks.md`** (NEW) — append-only log of user-decision-blocked items + non-blocking design-review follow-ups from iters 022 through 027. Captures the Phase 9 gate, #20 and #30 dependencies, and the queue of polish items so future iters can pick up where this loop left off.
- **`components/ChallengeCompletedDialog.tsx`** — three Lucide swaps. `Trophy` → `<ThemedIcon name="trophy">` (L84, hero glyph in the day-X-of-X celebration), `InfinityIcon` → `<ThemedIcon name="infinity">` (L104, "continue as habit tracker" button glyph), `RefreshCcw` → `<ThemedIcon name="rotate-cw">` (L124, "start a new challenge" button glyph). Lucide import removed. This dialog is shown to ALL users on challenge completion — ThemedIcon's variant lookup auto-selects Lucide for non-Earned themes and the hand-drawn variants under Earned, so other themes are unaffected.
- **`components/guest-signup-banner.tsx`** — `X` → `<ThemedIcon name="close">` (L47, dismiss button). Lucide import removed.

## Verified

- `npx next build` passes (19 static pages, no type errors).
- No design-review subagent dispatched — these are 1:1 swaps of icons already in the ThemedIcon variant map (trophy, infinity, rotate-cw, close all pre-existed) and the surfaces don't gain new behavior. Class A review reserved for substantive visual/voice work.

## Open backlog
- `#20` (Phase 4 IA blocker) — user-blocked. Documented in `logs/blocks.md`.
- `#30` (counter habit interaction model) — user-blocked. Documented.
- **Phase 9 main-merge gate** — user-blocked. Documented.

## Wake-up handoff

- **Current phase:** Earned transition — integration branch mature; main-merge gate is the next material event.
- **Next step (iter-029):** with all material decisions now logged in `logs/blocks.md`, the loop should either (a) continue mop-up work — more non-coach Lucide → ThemedIcon swaps (theme-switcher's `Check`, ChallengeUpcoming's `CalendarClock` — needs a new `calendar-clock` variant), (b) tackle Phase 10 leftover items like `/design-system` dev-only route, or (c) audit `app/layout.tsx` metadata for first-person voice. None are urgent. If the user has resolved any of #20 / #30 / Phase 9 gate in the meantime, prioritize that.
- **Files to open first:** `logs/blocks.md` (check for any new entries), `components/theme-switcher.tsx`, `components/challenge-upcoming.tsx`, `app/layout.tsx`.
- **Open questions:** see `logs/blocks.md`. None new this iter.
- **Carry-forward:** none. state.json iter `27 → 28`, latest.md → iter-028.md.
- **Scheduled:** 1800s — impl work has dried up pending the user decisions; longer cadence matches.

## Push: ok — branch pushed when PR opened.
