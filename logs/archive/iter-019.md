# iter-019 — Phase 2 friends polish: EmojiPicker + RequestsTab + focus-ring

**Branch:** `earned/phase2-friends-polish` → PR into `ux-refresh-simplified-challenge-driven`
**Scope:** 3 items — closes #35. Friends Phase 2 materially done.

## Shipped
- **EmojiPicker icons** (`components/friends/emoji-picker.tsx`) — Lucide `<Plus />` and `<X />` swapped to `<ThemedIcon name="plus" />` and `<ThemedIcon name="close" />`. Removed Lucide import.
- **RequestsTab icons** (`components/friends/requests-tab.tsx`) — Lucide `<Inbox />` and `<Send />` swapped to `<ThemedIcon name="inbox" />` and `<ThemedIcon name="send" />`. Removed Lucide import.
- **2 new hand-drawn icons** in `components/earned/icons/`:
  - `PlusEarned` — two crossed strokes at 2px stroke, rotate(-2°), endpoints offset off-grid (5.2/19/11.8/12) so the glyph reads as hand-drawn rather than mathematically symmetric (reviewer caught the original perfectly-symmetric version was indistinguishable from Lucide at 16px).
  - `InboxEarned` — wobbly tray with notched top edge + interior downward arrow indicating "incoming".
- **ThemedIcon variant map** now 20 entries. New variants: `plus` / `close` (reuses `CrossMarkEarned`) / `inbox` / `send` (reuses `PaperAirplaneEarned` — same folded-plane glyph used for friend-nudge button; both read as "this note is going somewhere").
- **Focus-ring contrast override** (`app/globals.css`) — new rule under `[data-theme="earned"] *:focus-visible`: `outline: 2px solid var(--earned-sky); outline-offset: 2px;`. Sidesteps shadcn's `ring-ring/50` alpha composition. Sky `#0090D8` on cream-light `#F9F3E1` ≈ 4.0:1, passes WCAG 3:1 for non-text UI with margin.

## Verified
- `npx next build` passes.
- **Class A design-review verdict: APPROVE_WITH_FOLLOWUPS.** All 3 items shipped cleanly. Reviewer caught PlusEarned's invisible-rotation issue (symmetric glyph + sub-pixel rotation = visually identical to Lucide); fixed mid-iter by offsetting endpoints. Two non-blocking follow-ups left in the wild:
  - Universal `*:focus-visible` outline stacks additively with shadcn's `ring-*` utilities still in place. Cosmetic; sweep `focus-visible:ring-*` usages in a later iter.
  - `close`+`send` variant reuse (CrossMark / PaperAirplane shared across semantic contexts) is defensible today but worth revisiting if/when a future surface puts Send + Nudge or Close + Missed-day in the same view.

## Backlog status
- Closed: **#35** (friends polish — EmojiPicker, RequestsTab, focus-ring).
- Open: #20 (Phase 4 IA blocker), #30 (counter habit — user call).
- Phase 2 friends surface is now materially done. Coach (L), Onboarding (L), auth, landing still pending.

## Merged this iter
- PR #69 (iter-018 — friend-search input + 3-up grid forward rule; closed #34) — APPROVED, CR + Workers Build green, squash-merged.

## Wake-up handoff
- **Current phase:** Earned transition — Phase 2 friends done. Coach / Onboarding / auth / landing remaining.
- **Next step:** iter-020 picks `/dashboard/coach` Earned restyle (L) — biggest remaining Phase 2 discovery surface. Expected to span 2-3 iters: first cut = chrome (page header, message list container, composer input), iter-021+ = bubble styling + recents dialog + handwritten coach voice.
- **Files to open first:** `app/(dashboard)/dashboard/coach/page.tsx` and any `components/coach/*` files. Cross-check the EARNED_TRANSITION.md Phase 2 § "/dashboard/coach" bullet for the design intent.
- **Open questions:** counter habit interaction model (#30) — still parked.
- **Carry-forward:** none. state.json iter `18 → 19`, latest.md → iter-019.md.
- **Scheduled:** 900s — impl iter + design-review buffer.

## Push: ok — branch pushed when PR opened.
