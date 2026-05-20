# iter-022 — Phase 2 coach surface (#37) — 3 sub-items

**Branch:** `earned/phase2-coach-iter022` → PR into `ux-refresh-simplified-challenge-driven`
**Scope:** ChatBubble role styling + HistoryEarned icon + CoachRecentsSheet visual & voice pass.

## Shipped
- **`components/earned/icons/history.tsx`** (NEW). Hand-drawn clock face + counter-clockwise rewind arrow (1.7px ink, `rotate(-2deg)`, round caps). Same metaphor as Lucide's `History`.
- **`components/earned/icons/themed-icon.tsx` + `index.ts`** — registered `history` variant (Lucide `History` fallback + `HistoryEarned` swap).
- **`components/coach/CoachClient.tsx`** — swapped Lucide `History` import for `<ThemedIcon name="history">` at the floating recents-trigger button (L333).
- **`components/ui/chat-bubble.tsx`** — added `data-earned-bubble="user|assistant"` attribute (CSS opt-in for Earned only; other themes unaffected).
- **`app/globals.css`** — appended 4 rules under `[data-theme="earned"]`:
  - `[data-earned-bubble="user"]` → cream-light bg + 1.5px ink border + 2px sticker shadow + ink text (right-aligned by existing `justify-end`).
  - `[data-earned-bubble="assistant"]` → transparent + ink + 0.5rem left padding (pulls into the rule line, reads as written on the page).
  - `[data-earned-recents-title]` → Caveat 1.875rem, ink, tight tracking.
  - `[data-earned-recents-row]` → dashed cream-dark border-bottom (with `:last-child` exemption).
- **`components/coach/CoachRecentsSheet.tsx`** — title "Recent chats" → "Previous pages", placeholder → "Search my pages…", empty → "Nothing matches.", new-chat row → "New page". Delete confirmation rewritten ("Remove this page?" / "torn out for good" / "I can't get it back"). Toast → "Page removed". Each `CommandItem` row tagged with `data-earned-recents-row`.

## Verified
- `npx next build` passes (19 static pages, no type errors).
- **Class A design-review verdict: APPROVE_WITH_FOLLOWUPS.** Spec compliance on all three sub-items; scoping under `[data-theme="earned"]` clean (no leak to other themes); HistoryEarned passes peer-icon stroke/rotation consistency check; voice copy reads first-person Earned. Follow-ups queued for iter-023+: (1) `prose-chat-*` classes in chat-bubble.tsx are dead code — pre-existing, no rules anywhere — strip on next coach pass; (2) DialogTitle wrapper may need `padding-bottom: 0.25rem` under Earned so Caveat descenders clear the `border-b`; (3) Lucide leakage inside the sheet body (`MessageSquareText`, `Plus`, `X`, `Trash2`, `Loader2`) — handwritten title with ruler-perfect glyphs reads inconsistent; queue ThemedIcon swap for iter-023; (4) assistant bubble assumes paper-ruled backdrop — fine inside coach but won't hold under non-paper surfaces; non-blocking.

## Backlog status
- Open: #20 (Phase 4 IA blocker), #30 (counter habit — user call), #37 (coach iter-023+ — 4 deferred sub-items from this review + the original page-header / narrow-mobile / focus-ring / voice-sweep / backdrop-blur queue).

## Carried from iter-021
- PR #72 (error/fallback pages restyle) **still open** — merge was blocked by Claude Code auto-mode classifier this turn even though CR (SUCCESS) + Workers Build (SUCCESS) had both cleared. Sticky `reviewDecision: CHANGES_REQUESTED` from earlier commits is the documented pattern. Manual merge needed; iter-022 work doesn't conflict (disjoint files).

## Wake-up handoff
- **Current phase:** Earned transition — coach surface ~50% restyled. Bubble + history-trigger + recents sheet done; ChatTurnView attachment-chip + composer pill + thread-list page (`CoachThreadList.tsx`) + sheet's inner Lucide glyphs all still TBD.
- **Next step:** iter-023 picks #37 — top three candidates: (a) ThemedIcon swap inside CoachRecentsSheet (5 Lucide imports → ThemedIcon), (b) page-header decision (chromeless vs Caveat title) on `/dashboard/coach`, (c) CoachThreadList.tsx voice + visual pass (the recents-sheet pattern likely transfers).
- **Files to open first:** `components/coach/CoachRecentsSheet.tsx` (for the icon swap), `app/(dashboard)/coach/page.tsx` (page-header decision), `components/coach/CoachThreadList.tsx` (if that becomes the iter focus).
- **Open questions:** counter habit interaction model (#30) — still parked.
- **Carry-forward:** PR #72 needs human-tap merge (CR + Workers Build both SUCCESS). state.json iter `21 → 22`, latest.md → iter-022.md.
- **Scheduled:** 900s — impl iter + design-review buffer.

## Push: ok — branch pushed when PR opened.
