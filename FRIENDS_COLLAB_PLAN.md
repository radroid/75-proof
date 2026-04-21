# Friends Tab Collaboration Features — Plan

Branch: `friends-collab-features` (off `mobile-polish`)

## Current state (quick recap)
- 3 sub-tabs: Activity, Friends (grid of progress cards), Requests
- `activityFeed` table w/ types: day_completed, challenge_started, challenge_completed, challenge_failed, milestone
- No reactions, comments, nudges, leaderboards, co-anything yet
- Sharing prefs already exist: `showStreak`, `showDayNumber`, `showCompletionStatus`
- 4 themes: arctic, broadsheet, military, zen

## Design principles
- **Small, shippable diffs.** Each feature = 1–2 commits.
- **Delight over completeness.** Every feature should feel joyful when you see it.
- **No new ceremony.** Don't add forms or modals where a tap will do.
- **Respects existing privacy controls.** Visibility rules still apply.

## Feature backlog (ordered by ship order)

### 1. Reactions on activity feed ("cheers") — ⭐ foundation
Let users tap to react to a friend's activity with one of a small set of emojis (🔥 💪 👏 ❤️). Shows count + whether you reacted. Inline, no modal.
- **Why first:** biggest engagement unlock; zero other features need it first
- **Backend:** new `feedReactions` table (activityId, userId, emoji), mutation to toggle, include counts in `getFriendsFeed`
- **Frontend:** tap row on each `ActivityFeed` item, optimistic toggle, small badges
- **Effort:** ~M

### 2. Friends leaderboard (weekly) — social proof
Add a "Leaderboard" mini-card at the top of the Friends tab: top 3 friends (+ you) by "days complete this week" or total streak. Friendly, not punishing.
- **Backend:** new query `getFriendsLeaderboard` — aggregates current-week completion counts from `habitEntries`/`dailyLogs` for user + accepted friends
- **Frontend:** compact horizontal card with ranked avatars, crown/medal for top 3
- **Effort:** ~M (aggregation query, UI)

### 3. Nudge a friend — low-friction encouragement
On a `FriendProgressCard`, add a "Nudge" button (small, secondary). Sends a lightweight ping that surfaces in the friend's activity feed as "Alex nudged you 👋". Rate-limited to once per friend per day.
- **Backend:** new activity type `nudge_received` + mutation `sendNudge` w/ rate limit
- **Frontend:** button on progress card + new activity row rendering
- **Effort:** ~S

### 4. Habit-level "who's done what today" strip — peer visibility
On the Friends tab header, a small strip: "Today: 🏋️ 4/6 friends worked out · 📖 3/6 read · 💧 2/6 hit water". Only aggregates, no per-friend breakdown (privacy-friendly).
- **Backend:** query that rolls up today's habit completion by category across friends
- **Frontend:** inline pill row, collapses to single line on mobile
- **Effort:** ~M

### 5. Co-streak badge on friend cards — shared identity
If you and a friend have both completed the same N consecutive days, show "🤝 5-day co-streak" chip on the friend card. Silent if < 2.
- **Backend:** extend `getFriendProgress` to include co-streak days
- **Frontend:** chip on `FriendProgressCard`
- **Effort:** ~S–M

### 6. Custom cheer message ("quick reply") — warmer tone
Instead of just emoji, short preset quick replies ("Let's go!", "You got this") that drop a one-line comment under the activity. Shown inline, capped to 3 visible.
- **Backend:** new `feedComments` table, query extension
- **Frontend:** quick-reply chips on activity row, comment list inline
- **Effort:** ~M (but can come after reactions)

### 7. Friend milestone celebration — reserved for later (diminishing returns gate)
Day 10/25/50/75 gets a special activity card with confetti vibe. Nice-to-have. Evaluate after #1–5 shipped.

## Stop condition
After features 1–5, assess whether another feature would add real collaboration value or just UI surface. Stop at diminishing returns.

## Theme + responsive checklist (applied to each feature)
- [ ] Renders correctly on arctic, broadsheet, military, zen
- [ ] Works mobile (< 768) and desktop (>= 768)
- [ ] Uses theme tokens (`bg-card`, `text-muted-foreground`, `border`, CSS vars) — no hardcoded hex
- [ ] Touch targets >= 44px on mobile
- [ ] Keyboard / focus-visible states
- [ ] `npx next build` passes before commit
