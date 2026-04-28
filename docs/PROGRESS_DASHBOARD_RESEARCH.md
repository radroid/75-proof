# Progress Dashboard Redesign — Research & Design Brief

> Status: Draft 1 (2026-04-28). Authored to drive the `feat/progress-dashboard-redesign` branch.
> Audience: implementer of the Progress page (and a future Friends-merge step).
> This is a research synthesis, not an implementation plan. Open questions are flagged with **🟡 OPEN**.

---

## 0. Why we're doing this

The current `app/(dashboard)/dashboard/progress/page.tsx` was built when the only routine was 75 Hard. It hardcodes Workouts / Water / Reading stat cards from the legacy `dailyLogs` table. With the multi-routine catalog (`popularRoutines`, `routineTemplates`) and the heterogeneous `habitDefinitions`/`habitEntries` model now live, those tiles are wrong for the meditator, the digital-detoxer, the language-learner, the deep-work practitioner. A productivity user staring at "0 gallons of water" on their dashboard learns that the app doesn't see them.

The goal of this redesign:

1. Make the personal dashboard fit any routine in the catalog (and any user-customised mix of habits).
2. Replace vanity tiles with metrics that have evidence behind them.
3. Sprinkle in *tasteful*, evidence-based friend signals on the personal dashboard, while keeping the full Friends tab — not a leaderboard transplant.

This document captures the research foundation. Implementation should not start until the open questions at the end are resolved.

---

## 1. Current state — what's actually in the codebase

(Ground truth — anchor every recommendation to this, not a generic "habit tracker.")

### Data model (`convex/schema.ts`)

- `**challenges`**: `userId`, `startDate`, `currentDay`, `status` ∈ {active, completed, failed}, `daysTotal?` (absent on legacy → defaults to 75), `isHabitTracker?` (true → open-ended, no end date), `templateSlug?`, `visibility` ∈ {private, friends, public}, `failedOnDay?`, `restartCount?`.
- `**habitDefinitions**` (per challenge): `name`, `blockType` ∈ {task, counter}, `target?` + `unit?` (counters only), `isHard` (binding rule: hard habits gate completion), `isActive`, `sortOrder`, `category?`, `icon?`.
- `**habitEntries**` (per habit per day): `completed: boolean`, `value?: number` (counters).
- `**dailyLogs**` (legacy 75-Hard-only): the workout1/workout2/water/reading/diet/noAlcohol/photo schema. Some users still on this; new flows use `habitDefinitions` + `habitEntries`. `isHistoryNewSystem` in `progress/page.tsx` already detects which.
- **Friend graph**: `friendships`, `activityFeed` (types: day_completed, challenge_started, challenge_completed, challenge_failed, milestone), `nudges`, `feedReactions` (emoji cheers).
- **Sharing prefs** on user: `preferences.sharing` ∈ {showStreak, showDayNumber, showCompletionStatus, showHabits} — already gates what `getFriendProgress` returns.
- **Catalog**: `popularRoutines` (descriptive, RAG fodder for the coach) and `routineTemplates` (instantiable, with `habits: [{name, blockType, target, unit, isHard, category, icon}]`).

### What's queryable today

- `api.challenges.getDayCompletionMap` → per-day boolean for the active challenge (already used).
- `api.challenges.getLifetimeStats` → `{ longestStreak, attemptNumber, … }`.
- `api.habitEntries.getAllEntriesForChallenge` → every per-habit entry for the active challenge.
- `api.feed.getFriendProgress` → for each friend honoring sharing prefs: `{user, challenge: {currentDay, startDate, daysTotal, isHabitTracker}, todayComplete, coStreak, habits: [{name, icon, category, isHard, completedToday}]}` — **this is the load-bearing API for friend signals on the dashboard**.
- `api.feed.getFriendsFeed` → activity-feed entries for friends (challenge_completed, day_completed, etc.).

### What the current Progress page renders (and the problems with each)


| Section                                                                             | Issue                                                                                                                                                                                            |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 6-tile stat grid (Days Completed, Best Streak, Attempt #, Workouts, Water, Reading) | Last three are `dailyLogs`-only; meaningless for non-75-Hard routines. Best Streak is from `getLifetimeStats` and is the only generic one.                                                       |
| Progress photos gallery                                                             | Only relevant when the active routine includes a photo task. Currently shown unconditionally.                                                                                                    |
| 75-day calendar grid                                                                | Hardcodes `daysTotal ?? 75` → for a 30-day yoga template the grid math implicitly works, but visual treatment doesn't adapt. Habit-tracker mode renders `currentDay + 7` cells, growing forever. |
| Day-by-day history                                                                  | Renders both legacy (`dailyLogs`) and new (`habitDefinitions`) shapes side-by-side via `isHistoryNewSystem`. Works, but is the only good part.                                                   |
| Friend signals                                                                      | None.                                                                                                                                                                                            |


The only stat card that survives a routine change is **Best Streak**. Everything else needs to bind to abstractions, not concrete habit names.

---

## 2. Evidence base — what the research says (cross-stream synthesis)

Four parallel research streams converged on the same handful of conclusions. The table below is the consensus; the sub-sections expand each row with supporting citations.


| Conclusion                                                                             | Personal-metrics stream                 | Behavioral-psych stream                                                                               | UX-pattern stream                                                | Social stream                                                                  |
| -------------------------------------------------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Streaks must be paired with completion-rate, not stand alone                           | ✅                                       | ✅ (Lally 2010: missing one day doesn't matter)                                                        | ✅ (Duolingo's grey flame is a credible threat, not a punishment) | ✅ (40% of streak-breakers churn within 2 weeks)                                |
| Heterogeneous habits → normalize each to "% of own target," then average               | ✅ (Apple rings model, Loop habit score) | n/a                                                                                                   | ✅ (HIG explicitly: rings are peer goals)                         | n/a                                                                            |
| Open-ended ≠ fixed-length: dashboards should branch                                    | ✅                                       | ✅ (Locke & Latham: bounded, time-limited goals are most effective; open-ended needs identity framing) | ✅ (Day-N-of-M progress bar vs heatmap)                           | n/a                                                                            |
| Identity language ("you're becoming…") beats raw counts                                | ✅                                       | ✅ (Atomic Habits + SDT competence)                                                                    | ✅ (Duolingo "you've learned 47 words" cards)                     | n/a                                                                            |
| Kindness signals (kudos, high-fives) > rank/leaderboard for retention                  | n/a                                     | ✅ (extrinsic gamification reduces intrinsic motivation — Hanus & Fox 2015)                            | ✅ (Apple Sharing tab pattern)                                    | ✅ (Strava kudos drive measurable behavior change; Duolingo Friend Streak +22%) |
| Lurkers (~80% of social users) need passive ambient signals, not asks                  | n/a                                     | n/a                                                                                                   | ✅ (Apple's friend-rings strip)                                   | ✅ (ambient awareness literature; "5 friends are on Day 12 today")              |
| Default-effect is powerful and dangerous: opt-out for wins, off-by-default for misses  | n/a                                     | n/a                                                                                                   | n/a                                                              | ✅ (96% vs 48% participation; defaults shape trust)                             |
| Domain matters: fitness tolerates competition; wellbeing/meditation collapses under it | n/a                                     | n/a                                                                                                   | n/a                                                              | ✅ (mindfulness research; Duolingo league anxiety)                              |


### 2.1 Streak vs completion rate

- **Streak alone is a trap.** Lally et al. 2010 (96 participants) showed that *missing a single day does not measurably affect habit formation*. A streak counter, by resetting to zero on a miss, lies to the user about what the science says. ([Lally 2010 — Eur. J. Soc. Psych.](https://onlinelibrary.wiley.com/doi/10.1002/ejsp.674))
- **The "what-the-hell" effect** (a.k.a. abstinence-violation, Polivy & Herman) cascades from that lie: once you're "ruined" you give up the rest of the day, then the week. Streak-shame UI accelerates this. ([Cohorty — psychology of streaks](https://blog.cohorty.app/the-psychology-of-streaks-why-they-work-and-when-they-backfire/), [Trophy data](https://trophy.so/blog/what-happens-when-users-lose-streaks))
- **Forgiveness with currency** (Duolingo streak freeze) cut at-risk-user churn 21%. Silent forgiveness is dishonest; visible-but-non-punishing tombstones ("rest day") preserve accuracy without shame.
- **Recommendation**: lead with **rolling 30-day completion rate**; show streak + best-streak as a small chip beside it. Never render a broken streak in destructive red on the dashboard.

### 2.2 Aggregating heterogeneous habits

- The dominant successful pattern is Apple's rings model: **each habit normalises to 0–100% of *its own* daily target, and the dashboard headline is the average** across active habits. Works for binary tasks (`completed ? 100% : 0%`) and counters (`min(value/target, 1) × 100%`). ([Apple HIG Activity Rings](https://developers.apple.com/design/human-interface-guidelines/components/status/activity-rings/))
- **Don't sum raw counts across habit types.** A user with "10 pages reading" + "64 oz water" should not see "74" anywhere. The dimensional confusion is exactly what the current dashboard does.
- **Composite weighted scores (Loop, WHOOP, Oura)** work *only* when the formula is forgiving (exponential smoothing → recent days dominate, single zero day barely moves the needle) **and** the user can tap-through to "why is this number what it is." Opaque scores erode trust.
- **For ≤4 habits**: stack as rings or tiles. For ≥5: sparkline-per-habit list (Streaks/Strides pattern) under a single normalized headline.

### 2.3 Open-ended vs fixed-length

These are different products. The current single dashboard for both is wrong.


|                     | Fixed-length (75 Hard, 30-day yoga, Couch-to-5K)             | Open-ended (habit tracker, journaling, Huberman, sober-curious)                   |
| ------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| Headline            | "Day 32 of 75" + linear progress bar                         | Rolling 30-day completion rate                                                    |
| Streak meaning      | = challenge progress (often binary all-or-nothing)           | One signal of consistency, not the goal                                           |
| Time grid           | Bounded grid, all cells visible                              | GitHub-style heatmap (year scroll) or current-month                               |
| Identity card       | "Halfway through 75 Hard"                                    | "You've journaled 4 of every 7 days for 6 months — journaling is who you are now" |
| Goal-gradient nudge | Steepening progress arc near completion (Kivetz et al. 2006) | Weekly proximal goals manufactured from rhythm                                    |
| Failure handling    | Restart vs continue (75 Hard *requires* restart)             | Tombstone day, never a banner                                                     |


### 2.4 Identity vs metrics

- Atomic Habits' "every habit is a vote for who you are becoming" framing is the under-shipped, high-leverage move across every app surveyed.
- A *single sentence* rendered above the dashboard ("You've meditated on 73% of days for 6 months. You're a meditator.") is the moment users in r/getdisciplined consistently cite as why a tracker "stuck." ([Tryhabitual](https://www.tryhabitual.com/journal/how-to-eat-better-identity-based-habits))
- For multi-routine apps especially: **identity unifies**, metrics don't. "Pages read" and "minutes meditated" don't share a unit; "you're someone who reads, runs, and meditates daily" does.
- Caveat: generated copy goes stale. Need a content rotation strategy or LLM templating with a strict guardrail to avoid "You journaled 3 days in a row" appearing daily.

### 2.5 Kindness vs competition (the key social finding)

The single cleanest split in the research:

> **Kindness signals (kudos, high-fives, emoji reactions) track with long-term retention. Competitive signals (rank, leagues, leaderboards) track with short-term DAU and accelerated churn after the first lapse.**

- Strava kudos measurably increase running, *especially when received from peers running similar volumes* — i.e., the mechanism is social affirmation, not pressure. ([ScienceDirect — Kudos make you run](https://www.sciencedirect.com/science/article/pii/S0378873322000909))
- Duolingo leagues drive engagement *while you're winning*, then cause "Sunday-night XP panic," XP gaming, churn. Friend Streak (kindness frame, ≤5 friends) lifted daily completion 22%. ([Duolingo Friend Streak](https://blog.duolingo.com/friend-streak/))
- Apple Fitness puts social on a *separate tab* with rings sharing — preserves the personal dashboard from comparison anxiety while still making co-presence visible.

For 75 Proof, whose KPI is long-term habit retention not time-in-app today: **kindness signals on the personal dashboard, competitive signals (if any) gated behind opt-in inside the Friends tab**.

### 2.6 The lurker majority

- ~80% of social users are lurkers; they read, they don't post. The dashboard should make passive presence valuable.
- "5 friends are on Day 12 today" is read by the silent majority and motivates without asking them to do anything.
- No social action should be load-bearing on the personal dashboard — every signal must be *additive*, not gating.

### 2.7 Privacy defaults


| Signal                                                                      | Recommended default                                    |
| --------------------------------------------------------------------------- | ------------------------------------------------------ |
| My completion ping ("Maya finished her morning routine") visible to friends | **opt-out** (on by default for confirmed friends only) |
| My misses visible to friends                                                | **off by default**, opt-in only                        |
| Friend kudos / high-five reception                                          | opt-out                                                |
| Cross-friend aggregates ("avg friend: 4/7 habits")                          | always anonymized                                      |
| Per-routine privacy override                                                | hide-this-entry as a one-tap escape                    |
| Anything beyond friend graph (public ranking)                               | opt-in, off by default                                 |


The current schema already supports this via `users.preferences.sharing` (showStreak / showDayNumber / showCompletionStatus / showHabits). We don't need a schema change for this part — we need correct defaults + a settings UI that makes them legible.

**Current defaults (verified in `convex/users.ts:60-66`):**

```ts
sharing: {
  showStreak: true,
  showDayNumber: true,
  showCompletionStatus: true,
  // showHabits omitted → falls back to `?? true` at read site (feed.ts:177)
}
```

These are all-on. Specifically `showCompletionStatus: true` makes the user's `todayComplete: false` *visible to friends* — i.e., today's misses are broadcast by default. The research in §2.5 and §2.7 says this is the riskiest of the four flags.

**Recommendation**: keep the *information* shared but **change the rendering on the consumer side**: the friend progress query already returns `todayComplete: boolean`. Render a positive `true` overtly ("Maya finished today"), but do **not** render `false` as "Maya hasn't finished today" anywhere on a friend's screen — translate `false` to neutral absence instead. Same data, different framing. No schema or default change required.

A second-pass option: split `showCompletionStatus` into `showWins` (default true) and `showMisses` (default false), and migrate existing rows to `{showWins: true, showMisses: prevValue}`. Defer until v2 unless user research surfaces the asymmetry.

### 2.8 Domain asymmetries

The current routine catalog (`popularRoutines`) has four categories: `fitness`, `skill-building`, `productivity`, `personal-development`. Research suggests these tolerate social differently:

- **Fitness**: tolerates competition. Strava-style segments and 7-day ring competitions work because the underlying activity is *intrinsically measurable* and external competition borrows that frame.
- **Skill-building** (Duolingo-shaped): tolerates streaks and pair accountability; *poorly* tolerates leagues. Pair streaks > rank.
- **Productivity** (Pomodoro, deep-work): tolerates accountability with named partners; doesn't benefit from public ranking.
- **Personal development / wellbeing** (meditation, journaling, sober-curious, digital detox): competition is **counterproductive**. Quiet shared presence ("12 people are meditating right now"), small-group co-streaks, *zero* ranking. ([ScienceDirect — Mindfulness impairs task motivation under extrinsic incentives](https://www.sciencedirect.com/science/article/abs/pii/S074959781630646X))

**Implication**: a per-routine "social intensity" axis — minimum {quiet co-presence | accountability | competition} — defaulted by the routine's category. Defaulted to *quiet* for personal-development, *accountability* for everything else, *competitive* opt-in only.

### 2.9 Stage-aware dashboards (formation → maintenance)

Lally's habit-formation curve is asymptotic with a ~66-day mean and 18–254 day individual variance. Wendy Wood's research adds that mature habits survive only when context cues remain. This implies the dashboard should *evolve*:


| Stage                      | Headline                                                 | Secondary                                          | Hide                                                    |
| -------------------------- | -------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------- |
| Days 1–30 (formation)      | Today's prompt + tiny celebration                        | Cue/anchor reminder, current streak (small)        | Aggregate %, comparisons, identity language (premature) |
| Days 30–90 (consolidation) | Rolling 30-day completion rate                           | Identity statement, streak (small), context-of-day | Long-term totals (still noisy)                          |
| Day 90+ (maintenance)      | Identity + recovery metric ("0 two-day gaps in 60 days") | Routine variance, context-change watch             | Streak — actively de-emphasize                          |


This is more ambition than draft 1 needs to land — but the IA should not preclude it. **🟡 OPEN: scope decision — do we ship stage-aware dashboards in v1, or just structure the components so it's possible later?**

### 2.10 Anti-patterns to avoid

- **Big red broken-streak banners.** Documented churn driver. ([Workbrighter](https://workbrighter.co/habit-streak-paradox/))
- **Vanity totals at the top.** "12,847 minutes meditated all-time" is feel-good but action-free.
- **Goodhart traps**: gamifying "logged a habit" rather than "did the habit"; minimum-viable-checkmark Duolingo lessons; reading-minutes left in background.
- **Opaque composite scores** without tap-through ("why is my readiness 64?").
- **Dashboard fatigue**: 35-metric dashboards are ignored after week 2. Start with 3–5 visible; surface more in drill-down.
- **Hardcoded routine metrics** — i.e., the bug we're fixing. Stat tiles must bind to *abstractions* (target, completion %, streak), not concrete habit names.
- **Customization-everywhere defaults** (Garmin Connect lesson). Ship strong defaults; add customization only when telemetry shows users want it.

---

## 3. Recommended dashboard IA (draft)

This is the proposal we'll iterate on. Concrete, mobile-first, bound to the data the schema already exposes.

### 3.1 Above the fold (phone, ~600px)

```
┌─────────────────────────────────────────┐
│ Personal development · You're on Day 12 │  ← context line (small)
├─────────────────────────────────────────┤
│                                         │
│  YOU'RE BECOMING SOMEONE WHO            │  ← identity card (hero)
│  meditates daily.                       │
│  This week, 5 of 7 days. ⚪⚪⚪⚪⚪⚪⚪      │
│                                         │
├──────────────┬──────────────────────────┤
│  87%         │  🔥 12        ✦ 23       │  ← rolling rate + streak chip + best
│  Last 30 d   │  Current      Best       │
└──────────────┴──────────────────────────┘
```

- **Context line**: routine name + "Day N of M" or "Day N" (no countdown for habit-tracker mode).
- **Identity card**: one sentence parametrized by routine and recent metrics. Refreshes weekly. Templates owned by the route handler, parameters driven by entries.
- **Headline metric**: rolling 30-day completion rate as the dominant number. Streak shown as a chip on the right with both current and best.

### 3.2 "Today snapshot" (read-only, not a logging surface)

> ⚠️ **Important IA constraint:** `/dashboard` is the logging page. It renders one of four themed checklists (`ArcticDashboard`, `BroadsheetDashboard`, `MilitaryDashboard`, `ZenDashboard`) where the user actually checks off habits and increments counters. **Progress must not duplicate this UI** — it's a separate role (retrospection vs action), and duplicating logging means duplicating state management.

So the Today block on Progress is a one-line *snapshot* with a tap-out, not a checklist:

```
┌─────────────────────────────────────────┐
│  TODAY · 4 of 6 done                    │
│  ●●●●○○                          Log →  │
└─────────────────────────────────────────┘
```

- Reads from the same per-day completion data already used by the headline.
- Tap → `/dashboard` (the themed logging page).
- If the day is fully complete, render in success colour with a celebratory micro-state ("All done — see you tomorrow"). This is the only place on Progress where today's *action* is acknowledged.

### 3.3 Friends ribbon (single strip — kindness, not competition)

```
┌─────────────────────────────────────────┐
│  WITH FRIENDS                           │
│  3 of 6 friends finished today          │  ← anonymized aggregate
│  🟢🟢🟢⚪⚪⚪                              │
│                                         │
│  🔥 You + Maya: 8-day co-streak         │  ← featured pair (Friend Streak)
│                                         │
│  ✦ 2 cheers on yesterday's run  →       │  ← inbox glance
└─────────────────────────────────────────┘
```

Three components, each load-bearing for a different research finding:

1. **Anonymized aggregate** ("3 of 6 finished today"): ambient awareness for lurkers, no individual exposed. Drives *quiet co-presence* feeling that the wellbeing/personal-development category needs.
2. **Featured co-streak with one named friend**: Duolingo Friend Streak pattern (small N, intimacy mechanism, +22% lift). Already supported by `getFriendProgress.coStreak`. Show only the highest-current-co-streak friend; if none, hide the row.
3. **Cheers/kudos inbox glance**: low-stakes affirmation; tap-through to Friends. Requires extending `feedReactions` queries to "what did people react to of mine in the last 7 days." **🟡 OPEN**: build this as a new query or just count reactions via existing tables?

What's NOT here:

- ❌ No leaderboard.
- ❌ No friend rank.
- ❌ No "X did better than you."
- ❌ No nudge UI on the personal dashboard (lives on Friends).

### 3.4 Calendar / consistency section

Two modes, branched on `challenge.isHabitTracker`:

**Fixed-length (e.g., 75 Hard):** the existing 75-cell grid, with three cleanly distinct states:

- complete = filled green
- today-pending = outlined ring (today shouldn't look like yesterday's miss)
- missed = ghost cell, not destructive red
- future = empty muted cell

**Open-ended (habit tracker):** GitHub-style year heatmap. Color-encodes a single value: per-day completion-rate (0/25/50/75/100%, five-step ramp). Sparse data caveat: **🟡 OPEN: do users with <30 days of data get the bounded-grid treatment instead of a mostly-empty year heatmap?**

Friend dots on the same calendar — small, optional, opt-in — are a research-validated touch (ambient co-presence). **🟡 OPEN: scope — ship in v1 or v2?** Likely v2 (data-cost on the query).

### 3.5 Per-habit drill-down (replaces the lifetime-totals row)

Sparkline-per-habit list, 30-day rolling rate per habit:

```
☑ Meditate 10 min    ▁▂▃▅▆▇▆▆▇▇▆▅▆▇▇    93% (28/30)
◐ Water 64 oz/day    ▁▃▅▇▇▆▅▅▆▇▇▆▆▆▆    78%
☑ Journal entry      ▆▇▇▇▇▆▇▆▇▇▆▇▇▇▇    97%
☐ No phone AM        ▁▁▂▃▃▄▄▅▅▅▆▆▆▆▆    52% — improving
```

- Replaces the "Total Workouts / Water / Reading" tiles entirely.
- Generic — works for any habit shape.
- The "improving" / "declining" annotation comes from a simple linear regression on the 30-day window (cheap to compute).
- Surfaces the *real* signal users want: "which habits am I dropping?"

### 3.6 Photos section — gated by routine

Only render the photos block when the active routine has a photo task (`habitDefinitions` row whose `name` matches "progress photo" pattern, or — more robustly — a new `category: "photo"` convention). Otherwise hide entirely. **🟡 OPEN: best detection mechanism — habit category, habit icon string, or a flag on the template?**

### 3.7 Day-by-day history

Keep largely as-is. The polymorphic legacy/new-system rendering already works (`isHistoryNewSystem`). One change: rename "No data" badge to "Rest day" when the day is in the past *and* the user has paused the challenge or the day is tagged as a freeze. **🟡 OPEN: do we track explicit freeze/rest days? If not, this is a future schema addition.**

---

## 4. Friends merge — staged, not big-bang

The user wants to eventually merge Friends into Progress while keeping the Friends tab live for now. Suggested staging:

- **Phase 1 (this PR)**: ship the Friends ribbon described in §3.3 on the Progress page. Friends tab continues to host the full activity feed, friend list, requests, and nudges. The dashboard treatment is *additive*; nothing is removed from `/dashboard/friends`.
- **Phase 2 (next PR)**: pull the activity feed into a third tab on Progress (Today / Stats / Activity), so the personal page becomes the social hub for the user-flavored, quiet stuff. Friends tab stays for the *management* surface (requests, search, block, sharing prefs).
- **Phase 3**: collapse Friends tab into a settings-style management page reachable from Progress. Bottom-nav slot frees up for something else (Coach is already there).

This avoids the leaderboard-on-personal-page anti-pattern: Phase 1 only adds *kindness* signals to the personal page; rank/competitive features (if any) stay on the Friends tab forever, opt-in.

---

## 5. Identity-card sentence templates (concrete starter set)

The identity card was the highest-leverage and least-shipped pattern in the research. Here's a starter library so it's not hand-wavy. Templates are parametrized; values come from existing queries.

**Variables available without new schema:**

- `routineLabel` — from `popularRoutines.title` or template
- `routineCategory` — `fitness` | `skill-building` | `productivity` | `personal-development`
- `currentDay`, `daysTotal`, `isHabitTracker` — from challenge
- `rolling30Rate`, `rolling7Rate` — derived from `getDayCompletionMap`
- `currentStreak`, `bestStreak` — derived
- `topHabit` — habit with the highest 30-day completion rate
- `weakestHabit` — lowest-completion non-paused habit
- `coachMemory.facts` — *if user opted in* (`users.coachMemory.enabled`), the coach has distilled durable facts the dashboard could surface ("you said morning workouts work for you — and you've completed mornings 5/7 days this week"). Strong personalization without re-asking; gate on `enabled` flag.

**Template library by stage and category** (5–8 per slot, randomly rotated weekly):

```
[FORMATION · days 1–14, all categories]
"You're making it past the hardest part. {currentDay} days down."
"Two weeks of evidence: you're someone who shows up."
"You've already done this {currentDay} times. That's the proof."

[FORMATION · day 14–30, with a strong habit]
"You ran {topHabit.streak} days in a row. That's not a streak — that's a pattern."
"{topHabit.name} is starting to look like who you are."

[CONSOLIDATION · days 30–90, fitness category]
"You're becoming someone who trains. {rolling30Rate}% of the last 30 days, no excuses."
"Three of every four days, you train. That sticks."

[CONSOLIDATION · skill-building]
"You've practiced {topHabit.name} on {rolling30Rate}% of days this month. Skill compounds — and you're compounding."

[CONSOLIDATION · productivity]
"You're protecting the work. {rolling30Rate}% of days, deep work happened."

[CONSOLIDATION · personal-development]
"You're someone who {routineActionVerb}. This week: {weekDots} ({rolling7Rate}%)."
  - meditator → "meditates"
  - journaler → "journals"
  - reader → "reads"
  - sober-curious → "stays clear-headed"

[MAINTENANCE · day 90+]
"Six months of {routineLabel}. You don't need a streak — this is who you are now."
"You've recovered from {missCount} missed days without a two-day gap. That's the skill."

[FIXED-LENGTH · all stages]
"{currentDay} of {daysTotal}. {pctRemainingFraction} more, and the version of you on Day {daysTotal} is waiting."
```

Implementation notes:

- Templates live in `lib/identity-cards.ts` as data, not LLM-generated. Cheap, deterministic, easy to A/B.
- Stale-copy guard: rate-limit identical phrasing to ≤1× per 14 days per user; rotate within the same eligible bucket.
- Failsafe: if no template matches the user's state, fall back to a generic "Day {currentDay} of your {routineLabel}" line. Never blank.
- 🟡 **OPEN**: do we want the user to write their own ("You're becoming a runner")? Coach onboarding could harvest this; defer to v2.

---

## 6. Accessibility, motion, and dark-mode

Easy to forget; cheap to get right early.

- **Heatmap colour**: don't rely on red-green alone. Five-step ramp should also vary lightness so it works on monochrome and for protanopia/deuteranopia users. The current calendar uses `bg-success` / `bg-destructive/10` / `bg-muted` — already mostly luminance-distinguished; the heatmap should follow.
- **Streak flame icon**: provide a non-emoji equivalent for screen readers ("Current streak: 12 days, best 23 days"); aria-label the chip, not the icon.
- **Identity card**: always render the underlying number alongside ("This week, 5 of 7 days · 71%") so the card is informative even when the narrative copy is muted in screen-readers.
- `**prefers-reduced-motion`**: existing code already respects this for the photo lightbox (`progress/page.tsx:251`). Honour it for ring-fill animations and the per-habit sparkline draw-in.
- **Tap targets**: 44×44pt minimum (already a project convention — `min-h-[44px]` is widespread). Heatmap cells likely fail this on phones. Either make cells expand-on-tap to a detail modal, or accept that the heatmap is overview-only and tap-targets are not promised.
- **Dark mode**: rings + heatmap need calibrated colour ramps for both schemes. The existing theme system is already dark-mode-aware; reuse `success`/`primary`/`muted-foreground` tokens.

---

## 7. Empty / loading / paused states


| State                                                           | Treatment                                                                                                                                                                           |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Day 0 (just onboarded)                                          | Skip the whole stat grid. Render only: identity card with "Day 0 — let's start" + Today snapshot pointing to `/dashboard`. No streak (it's 0), no completion-rate (no denominator). |
| Days 1–6                                                        | Show streak; rolling-rate uses `daysSinceStart` as denominator and labels itself "Last {n} days" not "Last 30 days."                                                                |
| First 30-day rate is below 30%                                  | No shame copy. Identity card switches to formation-stage templates. Friends ribbon shows aggregate but skips co-streak (likely 0).                                                  |
| No friends yet                                                  | Skip friends ribbon entirely. Don't render an "Add friends" CTA on Progress — it belongs on Friends tab.                                                                            |
| Paused / vacation (🟡 OPEN — schema may not support pause flag) | Tombstone affected days; rolling-rate denominator skips paused days; identity card shifts to "you took a break — that's part of the work."                                          |
| Loading                                                         | Skeletonize the identity card (animated gradient block), the headline metric, and the friends aggregate. The day-by-day history already has a working skeleton.                     |


---

## 8. Performance & query budget

Per page render, the dashboard already runs ~6 Convex queries (challenges, logs, photos, lifetime stats, completion map, habit defs, habit entries). Additions in this design:


| New section                                           | Data source                                                                                       | Cost                                                                                  |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Rolling-30-day rate                                   | Derive in client from existing `getDayCompletionMap`                                              | Free                                                                                  |
| Identity card                                         | Same                                                                                              | Free                                                                                  |
| Today snapshot                                        | Existing data                                                                                     | Free                                                                                  |
| Friends ribbon (aggregate + co-streak + cheers count) | Existing `getFriendProgress` (already returns `coStreak`, `todayComplete`)                        | Free for aggregate + co-streak; cheers requires extending or batching `feedReactions` |
| Per-habit sparkline list                              | Existing `getAllEntriesForChallenge` + client aggregation                                         | Free                                                                                  |
| Heatmap (year mode)                                   | New: needs per-day completion across full history; current `getDayCompletionMap` is per-challenge | **Adds** one query for habit-tracker users; bounded by their history length           |


**Recommendation**: ship the dashboard without a dedicated cheers query. If `feedReactions` joined to recent `activityFeed.userId == me` is cheap, do it client-side; otherwise add a `getRecentReactionsForMe` query in v2 once telemetry shows it's hit often.

---

## 9. Success metrics — how do we know it worked?

Before implementing, define what "working" looks like. Suggested PostHog events to add or watch:

- `**progress_page_view`** — already exists? If not, add. Track session duration on Progress.
- `**progress_to_log_tap**` — taps on the Today snapshot's "Log" link. Indicates the dashboard is driving action.
- `**progress_friends_ribbon_view**` — ribbon was visible (impression). Compare DAU/WAU between users with friends (ribbon visible) and without.
- `**identity_card_dismissed**` *(if we add a dismiss)* — signal that the copy is annoying or stale.
- **Retention 14/30/60-day** for users on the new dashboard vs old (A/B if possible). Research predicts the new dashboard should improve 30-day retention; if it doesn't, we're wrong about something.
- **Completion-rate distribution shift** — if removing streak-shame works, we should see fewer "broke streak then quit" patterns (sequences of all-zero days following a long streak).

---

## 10. Questions to answer before implementation (🟡 OPEN list)

These are the gaps that would make me uncomfortable starting to code today. Resolve before writing the implementation plan.

1. **Identity-card copy generation** — confirm the template library in §5 is the chosen approach (vs LLM-generated). I recommend templates: deterministic, auditable, A/B-testable.
2. ~~**Inline logging on Progress vs link-out to `/dashboard**`~~ — **resolved**: read-only snapshot, link out to `/dashboard`. The themed dashboards there are the logging surface.
3. **Photos detection** — habit category string, icon string match, or a new flag on `habitDefinitions`? Adding a flag is cleanest but requires migration.
4. **Sparse heatmap fallback** — at what data threshold do we switch from year-heatmap to a bounded grid for habit-tracker users? <30 days? <90?
5. **Stage-aware dashboards** (§2.9) — v1 or just structure-it-for-later? Recommend the latter: ship one dashboard with stage-aware copy in the identity card; defer per-stage layouts until we have telemetry.
6. ~~**Default sharing prefs for new users**~~ — **resolved in §2.7**. Defaults are all-true; recommendation is consumer-side framing (don't render `false` as a negative), no schema change.
7. **Friend dots on the calendar** — query cost is non-trivial. Defer to v2.
8. **"Cheers" inbox glance** — new query or compose? Recommendation: compose for v1.
9. **Routine-category-driven social intensity** (quiet/accountable/competitive) — schema field, or inferred from `popularRoutines.category`? Inferred is cheaper for v1.
10. **Fixed-vs-open-ended branching** — is `challenge.isHabitTracker` the right single signal, or also `daysTotal > 180`? Confirm with a quick `popularRoutines` audit.
11. **Goodhart hygiene on rolling 30-day rate** — does it drop to 0% if the user pauses for vacation? Pause-aware denominator requires explicit pause tracking, which we may not have today.
12. **Dual-mode users** (one challenge in fixed mode, another archived) — confirm headline scopes to active challenge.
13. **Coach memory hookup** — if `coachMemory.enabled`, can the identity card pull from `coachMemory.facts` for personalisation? Requires a server-side merge or surfacing facts to the page; defer to v2 with a feature flag if interesting.
14. **Friends merge phasing** (§4) — does the user want Phase 1 (ribbon on Progress) only, or both Phase 1 and 2 (activity feed on Progress as a tab) in this PR?

---

## 11. Sources

The research underlying this doc came from four parallel agent runs. Sources cited inline above; consolidated bibliography:

**Personal-metrics & dashboard patterns**

- [Cohorty — Psychology of Streaks](https://blog.cohorty.app/the-psychology-of-streaks-why-they-work-and-when-they-backfire/)
- [HabitPath — Why Streaks Are Toxic](https://www.habitpath.xyz/blog/why-habit-tracker-streaks-are-toxic)
- [Loop Habit Tracker FAQ](https://github.com/iSoron/uhabits/discussions/689) — exponential smoothing formula
- [Streaks app](https://streaksapp.com/), [Streaks 6.1 Stats Widget](https://thesweetsetup.com/streaks-6-1-introduces-an-incredibly-useful-stats-widget-for-ios-14/)
- [Way of Life](https://wayoflifeapp.com/) — three-state colour coding
- [Strides app help](https://www.stridesapp.com/help/) — Pace metric
- [Strava — Relative Effort](https://blog.strava.com/relative-effort/) — trailing-12-week baseline
- [Apple HIG — Activity Rings](https://developers.apple.com/design/human-interface-guidelines/components/status/activity-rings/)
- [Beeminder — Bright Red Line](https://blog.beeminder.com/brl/)
- [WHOOP Recovery](https://www.whoop.com/us/en/thelocker/how-does-whoop-recovery-work-101/), [Oura new app](https://ouraring.com/blog/new-oura-app-experience/)
- [Quantified Self Forum — Personal Dashboards](https://forum.quantifiedself.com/t/personal-dashboards-for-self-tracking-data/8202)
- [Geckoboard — Vanity Metrics](https://www.geckoboard.com/blog/vanity-metrics-on-your-dashboard-are-they-always-so-bad/)

**Behavioral psychology & habit formation**

- Lally et al. 2010 — "How are habits formed" ([wiley](https://onlinelibrary.wiley.com/doi/10.1002/ejsp.674), [UCL summary](https://www.ucl.ac.uk/news/2009/aug/how-long-does-it-take-form-habit))
- Locke & Latham 2006 — Goal-Setting Theory ([PDF](https://home.ubalt.edu/tmitch/642/articles%20syllabus/locke%20latham%20new%20dir%20gs%20curr%20dir%20psy%20sci%202006.pdf))
- Ryan & Deci 2000 — Self-Determination Theory ([PDF](https://selfdeterminationtheory.org/SDT/documents/2000_RyanDeci_SDT.pdf))
- Clark et al. 2009 — Near-miss effect ([PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC2658737/))
- Kivetz, Urminsky & Zheng 2006 — Goal-gradient ([PDF](https://home.uchicago.edu/ourminsky/Goal-Gradient_Illusionary_Goal_Progress.pdf))
- Gollwitzer 1999 — Implementation intentions ([PDF](https://www.prospectivepsych.org/sites/default/files/pictures/Gollwitzer_Implementation-intentions-1999.pdf))
- Hanus & Fox 2015 (gamification reduces motivation), discussed in [Springer meta-analysis](https://link.springer.com/article/10.1007/s11423-023-10337-7)
- Fogg Behavior Model ([primary site](https://www.behaviormodel.org/))
- Wendy Wood — context-cued habit research ([Behavioral Scientist interview](https://behavioralscientist.org/good-habits-bad-habits-a-conversation-with-wendy-wood/))
- [Atomic Habits identity framing](https://www.tryhabitual.com/journal/how-to-eat-better-identity-based-habits)
- [Smashing Mag — Streak System UX](https://www.smashingmagazine.com/2026/02/designing-streak-system-ux-psychology/)

**Social / friend-driven motivation**

- [ScienceDirect — Kudos make you run!](https://www.sciencedirect.com/science/article/pii/S0378873322000909) — primary Strava research
- [Duolingo Friend Streak — +22% lift](https://blog.duolingo.com/friend-streak/), [product lessons](https://blog.duolingo.com/product-lessons-friend-streak/)
- [PMC — Mixed-methods Strava Use](https://pmc.ncbi.nlm.nih.gov/articles/PMC12938745/) — anxiety/hiding-workouts findings
- [Aftermath — Duolingo gamification critique](https://aftermath.site/duolingo-gamification/)
- [Frontiers — fitness app social comparison wellbeing](https://www.frontiersin.org/journals/public-health/articles/10.3389/fpubh.2025.1632598/full)
- [Athletech — Fitness apps may reduce motivation](https://athletechnews.com/popular-fitness-apps-may-reduce-motivation-study/)
- [Trophy — what happens when users lose streaks](https://trophy.so/blog/what-happens-when-users-lose-streaks) — ~40% post-break churn
- [PMC — Ambient awareness](https://pmc.ncbi.nlm.nih.gov/articles/PMC4853799/)
- [Frontiers — Lurking behavior](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2024.1406895/full)
- [ITIF — Opt-in vs Opt-out economics](https://itif.org/publications/2017/10/06/economics-opt-out-versus-opt-in-privacy-rules/)
- [Apple — Close Your Rings / Activity Sharing](https://www.apple.com/watch/close-your-rings/)
- [Strava Kudos](https://support.strava.com/hc/en-us/articles/216918397-What-is-Kudos)
- [Peloton high-fives blog](https://www.onepeloton.com/blog/peloton-motivation-high-fives)

**UX patterns & visualization**

- [Whoop home screen redesign](https://www.whoop.com/us/en/thelocker/the-all-new-whoop-home-screen/)
- [Duolingo home screen design](https://blog.duolingo.com/new-duolingo-home-screen-design/)
- [Garmin Connect revamp (DC Rainmaker)](https://www.dcrainmaker.com/2024/01/garmin-connect-through.html)
- [Strava Training Log](https://support.strava.com/hc/en-us/articles/206535704-Training-Log)
- [GitHub contribution graph](https://medium.com/hackernoon/how-to-recreate-githubs-contribution-graph-a0a8d4d91011)
- [NN/g empty states](https://www.nngroup.com/articles/empty-state-interface-design/)
- [Smashing — empty states in onboarding](https://www.smashingmagazine.com/2017/02/user-onboarding-empty-states-mobile-apps/)
- [Notion habit tracker templates](https://www.notion.com/templates/category/habit-tracking)
- [Gridfiti 75 Hard templates](https://gridfiti.com/75-hard-challenge-templates/)

