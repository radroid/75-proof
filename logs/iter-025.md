# iter-025 — Phase 2 #37 — coach composer glass→paper + placeholder voice sweep

**Branch:** `earned/phase2-coach-iter025` → PR base `ux-refresh-simplified-challenge-driven` (single-PR, no stacking — PR #76 merged at the top of this turn so the integration tip is clean).
**Scope:** two sub-items: composer pill restyle (kill backdrop-blur under Earned + 3-state send button), placeholder voice sweep (drop "the coach" framing).

## Shipped
- **`app/globals.css`** — `[data-theme="earned"] [data-earned-composer]` rule extended with `backdrop-filter: none` + `-webkit-backdrop-filter: none`. The composer's Tailwind `backdrop-blur` + `supports-[backdrop-filter]:bg-background/80` classes still apply on non-Earned themes (iMessage-style glass) but are killed under Earned so the cream-paper sticker recipe holds without competing translucency. Specificity check: `[data-theme="earned"] [data-earned-composer]` = 0,2,0 vs Tailwind class = 0,1,0 — the data-attr rule wins cleanly, no `!important` needed.
- **`components/coach/CoachComposer.tsx`** — send button refactored to 3 explicit states (pending / canSend / disabled). Previously `pending` collapsed into the same `bg-muted` as the empty-draft state, so the dots-only loading indicator rendered on a cream-dark background indistinguishable from "no text yet." Now:
  - **pending** → `bg-primary/60 text-foreground` (muted sky with ink dots — ~7:1 contrast, AAA. Initial attempt was `text-primary-foreground` which composited to ~2.5:1 contrast — caught by Class A design-review mid-iter and fixed.)
  - **canSend** → `bg-primary` + hover `bg-primary/90` (full sky, ready to send).
  - **disabled-empty** → `bg-muted text-muted-foreground` (greyed).
- **`components/coach/CoachClient.tsx`** — `placeholder` useMemo voice sweep:
  - "Ask the coach anything…" → "Ask anything…" (drops redundant "the coach" since the surface IS the coach).
  - "Reply to the coach…" → "Write back…" (under user-as-protagonist, user is the active party).
  - "Ask about ${attachment.title}…" — unchanged (attachment title is user-attached context, not a coach reference).

## Verified
- `npx next build` passes (19 static pages, no type errors).
- **Class A design-review verdict: APPROVE_WITH_FOLLOWUPS.** Composer glass kill clean (specificity verified, no `!important` needed); non-Earned themes unaffected; 3-state send-button semantics correct; voice copy lands well; no double-dim risk from the textarea's `disabled:opacity-60` (button has no `disabled:opacity-*` utility). Primary follow-up (`bg-primary/60` text-color contrast failure at ~2.5:1) **applied mid-iter**. Remaining follow-ups (deferred to iter-026+):
  - `CoachClient.tsx:410` "coach is thinking" loading label — visible to user, mildly tensions with the user-as-protagonist rule. Consider "thinking" or "writing back" on next pass.
  - `components/coach/CoachEmptyState.tsx:59,62` — "Hi, I'm your coach." / "I help you reach your goals" — sets the coach-as-other framing; out of scope but flagged.
  - `components/coach/CoachPrivacySettings.tsx:304` — "Chat with the coach to start your bio" still uses "the coach" framing.
  - `components/ui/chat-bubble.tsx:29` — `aria-label="Coach message"` (sr-only) — leave as-is per iter prompt.

## Branch / merge state
- PR #72 (iter-021): MERGED earlier.
- PR #73 (iter-022 + iter-023): MERGED this turn (after human authorization, conflict resolved locally + auto-merge).
- PR #74 (iter-023): MERGED (via stacked squash into iter-022's branch before the cascade).
- PR #75 (iter-024 first attempt): auto-closed when GH deleted its stacked base branch on #73's merge.
- PR #76 (iter-024 re-opened on rebased integration): MERGED at the top of this turn.
- PR #77 (this iter): about to open with base = integration. No stacking required.

## Backlog status
- Open: #20 (Phase 4 IA blocker), #30 (counter habit — user call), #37 (coach iter-026+ continuation — remaining coach-as-other strings + project-wide Loader2 cleanup in DailyChecklist + button.tsx + sonner.tsx).

## Wake-up handoff
- **Current phase:** Earned transition — coach surface ~90% restyled. Composer pill is the last big visual hold-out. Remaining are inline copy strings + the project-wide Loader2 audit.
- **Next step:** iter-026 picks #37 — top three candidates: (a) coach-as-other voice sweep across CoachClient L410 ("coach is thinking"), CoachEmptyState.tsx (Hi, I'm your coach…), CoachPrivacySettings.tsx ("Chat with the coach"), (b) project-wide Loader2 cleanup in DailyChecklist L1005 + button.tsx L81 + ui/sonner.tsx L22 (shared infra — needs caution), (c) coach onboarding-to-dashboard transition copy review (post-onboarding, what does the user see when they first land on the coach page?).
- **Files to open first:** `components/coach/CoachClient.tsx` L410, `components/coach/CoachEmptyState.tsx`, `components/coach/CoachPrivacySettings.tsx` L304, `components/ui/button.tsx` L81.
- **Open questions:** counter habit interaction model (#30) — still parked.
- **Carry-forward:** none — PR cascade unwound this turn. state.json iter `24 → 25`, latest.md → iter-025.md.
- **Scheduled:** 900s — impl iter + design-review buffer.

## Push: ok — branch pushed when PR opened.
