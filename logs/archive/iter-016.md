# iter-016 — Phase 2 activity-feed icons

**Branch:** `earned/phase2-activity-feed-icons` → PR into `ux-refresh-simplified-challenge-driven`
**Scope:** 1 item from #34 — swap the 5-icon activity-feed `typeIcons` map under Earned. Today-pulse / weekly-leaderboard / friend-search / 3-up shadow rule still deferred.

## Shipped
- **4 new hand-drawn icons** in `components/earned/icons/`: `RocketEarned`, `TrophyEarned`, `FlameEarned`, `RotateCwEarned`. All 1.7px stroke, round caps/joins, rotation in [-2°, -2°]. ThemedIcon variant map now covers 16 icons; barrel re-exports each.
- **`components/friends/activity-feed.tsx`** split the `typeIcons` map into `typeIcons` (default — unchanged Lucide CheckCircle2 / Rocket / Trophy / RotateCcw / Flame) and `earnedTypeIcons` (new). At component top, `iconMap` selects via `useThemePersonality()`. Earned mapping:
  - `day_completed` → brand `<Star size={16} />` — "I earned a star today"
  - `challenge_started` → ThemedIcon `rocket`
  - `challenge_completed` → ThemedIcon `trophy` (with gold tint via `text-[var(--earned-star-gold)]`)
  - `challenge_failed` → ThemedIcon `rotate-cw`
  - `milestone` → ThemedIcon `flame`
- The `<Activity className="h-10 w-10..." />` empty-state Lucide glyph is untouched (it's not in the typeIcons map).

## Verified
- `npx next build` passes.
- **Class A design-review verdict: APPROVE_WITH_FOLLOWUPS.** Reviewer initially flagged TrophyEarned as dead code (Star reuse for challenge_completed would orphan it); resolved mid-review by wiring Trophy in for challenge_completed so each event type carries a distinct glyph (Star reserved for day_completed alone). Also fixed flame rotation `-3°` → `-2°` for spec band compliance. Remaining note: RotateCw arc-to-head continuity gap is functional but not crisp — flagged for iter-017+ polish if a designer eyeball confirms.

## Deferred to iter-017+
- RotateCw arc-end → arrow-head continuity tighten (extend the arc terminus closer to the arrow head).
- Remaining #34 items: today-pulse, weekly-leaderboard, friend-search input chrome, 3-up grid shadow density rule.

## Backlog status
- Closed: none new (#34 still in_progress, ~4 items left).
- Open: #20 (Phase 4 IA blocker), #30 (counter habit — user call), #34 (friends iter-016+ continuation).

## Merged this iter
- PR #66 (iter-015 — friends section first cut: PaperAirplane + FriendProgressCard sticker + section heading) — CR + Workers Build green, squash-merged. CR formally APPROVED for the first time in several iters.

## Wake-up handoff
- **Current phase:** Earned transition — Phase 2 friends in progress.
- **Next step:** iter-017 picks remaining #34 items. Today-pulse (`components/friends/today-pulse.tsx`) is the next-most-visible — needs the sticker tile treatment + Caveat for the highlight number. Pair with weekly-leaderboard rank glyphs.
- **Files to open first:** `components/friends/today-pulse.tsx`, `components/friends/weekly-leaderboard.tsx`.
- **Open questions:** counter habit interaction model (#30) — still parked.
- **Carry-forward:** none. state.json iter `15 → 16`, latest.md → iter-016.md.
- **Scheduled:** 900s — impl iter + design-review buffer.

## Push: ok — branch pushed when PR opened.
