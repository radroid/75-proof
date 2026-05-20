# iter-018 — Phase 2 friends: search input + grid-shadow forward rule

**Branch:** `earned/phase2-friends-search` → PR into `ux-refresh-simplified-challenge-driven`
**Scope:** 2 items — closes #34. New task #35 captures additional friends polish the design-review surfaced.

## Shipped
- **Friend-search input chrome** (`components/friends/friend-search.tsx`) — `data-earned-input` attribute on the shadcn `<Input>`, `data-earned-section-heading` on the "Add a friend" caption (re-uses iter-015's rule). CSS rule under `[data-theme="earned"] [data-earned-input]`:
  - `background-color: var(--earned-cream-light)`
  - `border-width: 1.5px; border-color: var(--earned-ink)`
  - `caret-color: var(--earned-sky)` (focus caret reads as the brand interactive accent)
  - placeholder `rgba(31,31,29,0.45)` on cream-light (≈3.6:1, passes AA for placeholder text)
- **3-up grid shadow forward rule** (`app/globals.css`) — `[data-earned-grid="cards"] > [data-earned-tile]:nth-child(even)` flips the shadow direction `2px 2px 0 → -2px 2px 0` so future surfaces growing to 3+ cols can opt in via the attribute and get a "tossed onto the desk" pattern instead of repeating noise. **No JSX consumer this iter** — FriendsList stays 2-up per iter-015's reviewer note that "uniform shadow direction reads fine at 2-up." Documented in CSS so iter-019+ can flip the attribute on without a fresh CSS migration.

## Verified
- `npx next build` passes.
- **Class A design-review verdict: APPROVE_WITH_FOLLOWUPS.** Cascade math confirmed: bare attribute selector `[data-theme="earned"] [data-earned-input]` beats Tailwind's `@layer utilities` regardless of class count. Sky caret + cream-light bg + placeholder contrast all reasonable. 3-up forward rule logic verified for 3-col stagger (no moiré). Reviewer flagged dead-CSS warning (no consumer this iter) — accepted with explicit commit-message documentation.

## Important reviewer note (logged as #35)
"Friends Phase 2 not materially done" — #34's scoped checklist closes but EmojiPicker icons + RequestsTab still leak Lucide defaults, and the shadcn `--ring` alpha on cream-light is a known a11y soft spot. Captured as task **#35** so the next Phase-2-friends pass has explicit scope.

## Backlog status
- Closed: **#34** (friends Phase 2 — per its 6-item checklist).
- Open: #20 (Phase 4 IA blocker), #30 (counter habit — user call), #35 (friends polish — EmojiPicker, RequestsTab, focus-ring contrast).
- Discovered this iter: #35.

## Merged this iter
- PR #68 (iter-017 — TodayPulse + WeeklyLeaderboard + RotateCw polish) — CR + Workers Build green, squash-merged.

## Wake-up handoff
- **Current phase:** Earned transition — friends surface ≈90% done. Coach (L) / Onboarding (L) / auth / landing still pending. Phase 1 motion + Phase 2 Today/Settings/Progress/Friends shipped.
- **Next step:** iter-019 has a fork in the road. Options: (a) **iter-019 = #35 mini-pass** to materially close friends Phase 2 (EmojiPicker icons + RequestsTab + ring contrast). (b) **iter-019 = Phase 2 next surface** — `/dashboard/coach` (L) or `/onboarding` (L). Recommendation: ship #35 first (small, scoped) since it leaves friends in a properly finished state before moving to a new L surface.
- **Files to open first:** `components/friends/emoji-picker.tsx`, `components/friends/requests-tab.tsx`, `app/globals.css` (for the `--ring` override).
- **Open questions:** counter habit interaction model (#30) — still parked.
- **Carry-forward:** none. state.json iter `17 → 18`, latest.md → iter-018.md.
- **Scheduled:** 900s — impl iter + design-review buffer.

## Push: ok — branch pushed when PR opened.
