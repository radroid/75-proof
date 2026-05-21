# iter-014 — Phase 2 progress closeout: identity + sparkline + first-person templates

**Branch:** `earned/phase2-progress-identity-spark` → PR into `ux-refresh-simplified-challenge-driven`
**Scope:** 3 items — IdentityCard restyle + first-person voice, per-habit Sparkline Earned variant, and a Phase 5 voice fix on the template library the design-review surfaced mid-iter. Closes #33.

## Shipped
- **IdentityCard** (`components/progress/identity-card.tsx`) — `data-earned-tile="identity"` attribute + matching CSS rule in `app/globals.css` (cream-light bg, 1.5px ink border, 2px sticker shadow). Headline copy switched second-person → first-person: `"You're becoming X"` → `"I'm becoming X"`; label `"Your identity"` → `"My identity"`. The Caveat headline (already routed through `var(--font-heading)`) stays the dominant element.
- **Per-habit Sparkline** (`components/progress/per-habit-list.tsx`) — under `[data-theme="earned"]`, the Sparkline renders a "marker-filled" progress bar: 2px dashed cream-dark baseline + 2.5px solid ink overlay from x=2 to `round(sum(series)/n * 96)`. `inkX > 2` guard suppresses phantom dots at near-zero completion. Non-Earned themes keep the existing bar-series variant.
- **Identity template library** (`lib/identity-cards.ts`) — design-review caught that 10 templates + the fallback line still spoke in 2nd person ("You showed up", "You're not most people", "Your body is starting to expect..."). Rewrote all to first-person ("I showed up", "I'm not most people", "My body is starting to expect..."). One template rephrased without a pronoun to keep the cadence ("4 days of X in a row" instead of "You did X 4 days in a row"). Fallback `"your routine"` → `"my routine"`.

## Verified
- `npx next build` passes (19 static pages).
- **Class A design-review verdict: APPROVE_WITH_FOLLOWUPS** — but the reviewer's required follow-up (template library voice regression) was applied mid-iter rather than deferred. No test snapshots reference the old template strings.
- `grep -nE 'you|your'` on `lib/identity-cards.ts` returns only this iter's edits (no leftover 2nd person).

## Backlog status
- Closed: **#33** (Phase 2 progress restyle — full set landed across iters 011-014).
- Open: #20 (Phase 4 IA blocker), #30 (counter habit — user call).
- Discovered: none new.

## Merged this iter
- PR #64 (iter-013 — heatmap ink-density + style hoist + legend mirror) — CR + Workers Build green, squash-merged.

## Wake-up handoff
- **Current phase:** Earned transition — Phase 2 progress done. Remaining Phase 2 surfaces: `/dashboard/coach` (L), `/dashboard/friends` (M), `/onboarding` flow (L), auth screens (M), landing/about (L).
- **Next step:** Recommend `/dashboard/friends` next — M-sized, friend cards + activity feed + nudge UI are all greenfield Earned candidates. `/dashboard/coach` is L and the chat surface deserves its own multi-iter run later.
- **Files to open first:** `app/(dashboard)/dashboard/friends/page.tsx` (or equivalent), `design-system/project/preview/components-chips.html`.
- **Open questions:** counter habit interaction model (#30) — still parked.
- **Carry-forward:** none. state.json iter `13 → 14`, latest.md → iter-014.md.
- **Scheduled:** 900s — impl iter + design-review buffer.

## Push: ok — branch pushed when PR opened.
