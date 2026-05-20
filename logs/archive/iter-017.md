# iter-017 — Phase 2 friends: TodayPulse + WeeklyLeaderboard + RotateCw polish

**Branch:** `earned/phase2-friends-pulse-board` → PR into `ux-refresh-simplified-challenge-driven`
**Scope:** 3 items from #34. Friend-search input chrome + 3-up grid shadow rule still deferred.

## Shipped
- **TodayPulse sticker tile** (`components/friends/today-pulse.tsx`) — `<Card data-earned-tile="pulse">`; "Today" caption gains `data-earned-section-heading` (colour lift to ink, tracking 0.3em → 0.18em); completion count span gains `data-earned-value` (Caveat 1.5rem 600 under Earned, makes the protagonist number dominant next to the "/ total complete" tail).
- **WeeklyLeaderboard** (`components/friends/weekly-leaderboard.tsx`) — `<Card data-earned-tile="board">`; "This Week" caption gets `data-earned-section-heading`. `rankIcon(rank, isEarned)` now branches: under Earned the brand `<Star />` carries the reward semantic at every podium position with stepped sizing 14/12/10 + opacity 1.0/0.7/0.5 (steps widened mid-review from 14/12/11 per reviewer note). Non-Earned themes keep the original Trophy/Medal/Award trio. `isEarned` threaded into `LeaderboardRow` via prop.
- **RotateCwEarned arc polish** (`components/earned/icons/rotate-cw.tsx`) — extended the arc with one additional cubic segment `C 20.6 12.2, 20.4 9.5, 20 7.6` so the terminus now lands at `(20, 7.6)`, coinciding exactly with the arrow chevron's middle vertex. Arc + arrow read as one continuous loop.
- **CSS** (`app/globals.css`) — unified `[data-earned-tile="friend" | "pulse" | "board"]` selector list sharing the cream-light + 1.5px ink border + 2px sticker shadow recipe.

## Verified
- `npx next build` passes.
- **Class A design-review verdict: APPROVE (after fix).** First pass returned **BLOCK** — the today-pulse edits had been lost during a mid-iter branch reset (deleted + re-created `earned/phase2-friends-pulse-board`; the original Edits lived only on the deleted branch). Re-applied the 3 data-attributes to today-pulse.tsx, rebuilt green, and resolved. Reviewer also flagged the 14→12→11 step as too subtle for the bottom step — adjusted to 14/12/10. Other notes (Caveat-vs-Poppins hierarchy live-check) deferred to iter-018 designer eyeball.

## Loop learning
The branch-reset lost-edit failure is a real risk pattern. iter-017's design-review caught it because the reviewer reads the actual diff state, not just my reported changes. Worth capturing in the loop's protocol: when resetting a branch, immediately re-verify any prior edits are still present via `git status` before running the next batch.

## Backlog status
- Closed: none new (#34 still in_progress, 2 items left).
- Open: #20 (Phase 4 IA blocker), #30 (counter habit — user call), #34 (friend-search + 3-up grid shadow rule).

## Merged this iter
- PR #67 (iter-016 — activity feed hand-drawn icons) — CR + Workers Build green, squash-merged.

## Wake-up handoff
- **Current phase:** Earned transition — Phase 2 friends 4/6 #34 items shipped.
- **Next step:** iter-018 picks remaining #34 items: friend-search input chrome (search bar visual under Earned) + 3-up grid shadow density rule (when FriendsList grows beyond 2 columns, sticker shadows can stack into visual noise — add a `:has` rule or alternating shadow pattern).
- **Files to open first:** `components/friends/friend-search.tsx`, `components/friends/friends-list.tsx`, `app/globals.css`.
- **Open questions:** counter habit interaction model (#30) — still parked.
- **Carry-forward:** none. state.json iter `16 → 17`, latest.md → iter-017.md.
- **Scheduled:** 900s — impl iter + design-review buffer.

## Push: ok — branch pushed when PR opened.
