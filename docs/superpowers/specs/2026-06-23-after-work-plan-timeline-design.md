# After-Work Plan Timeline — Design Spec

**Date:** 2026-06-23
**Status:** Approved (brainstorm) → implementing (autonomous overnight build)
**Branch:** `feat/after-work-plan-timeline`
**Author:** Raj + Claude

---

## 1. Summary

Add a new **Plan** surface (`/dashboard/plan`) that gives the day a *time-of-day*
dimension the app currently lacks. The user declares their **work hours** for the
day; the app treats work as a fixed block and **auto-schedules their habits into the
free window after work** on a vertical timeline. Blocks can be dragged to re-time and
resized. Checking off a block marks the underlying habit done in the **same data** the
existing Today checklist uses, so the two surfaces never disagree. Signed-in users get
**push reminders** at each scheduled block time; local/guest users get best-effort
in-page reminders. Shipped **dark-launched** behind a PostHog flag enabled for the
owner only.

Visual direction (locked during brainstorm): **"calm / minimal"** — warm/neutral
surface, one muted accent, hairline rules, light type, generous whitespace, a timeline
"spine" with small nodes, a collapsed Work bar, an "Anytime today" tray. Final styling
is theme-aware (Arctic / Broadsheet / Military / Zen).

## 2. Goals & non-goals

**Goals (v1):**
- Declare work hours per day (with a saved "usual schedule" default that pre-fills).
- Auto-arrange habits into the after-work free window, deterministically.
- True touch **drag-to-retime** and **edge-resize**, snapping to a 5-minute grid.
- Completion of a block writes the **existing** `habitEntries` (single source of truth).
- Per-block **reminders** — real background push for signed-in; in-page for local.
- Works for **both** signed-in (Convex) and local/guest (localStorage) users.
- Maximum test coverage (unit + Convex integration + automated UI).

**Non-goals (explicitly deferred):**
- Google Calendar / external calendar sync. (Schema is shaped to allow it later: a
  `kind: "busy"` block type can hold imported events; `source` field reserved.)
- Multi-day / tomorrow planning. **v1 plans _today_ only.** Past days are read-only.
- Automatic dinner/break insertion. User adds a one-off `break` block manually.
- Changing the 4 themed dashboards or the existing Today checklist behavior.

## 3. Key decisions (from brainstorm + overnight directive)

| Decision | Choice |
|---|---|
| Core JTBD | Visual day timeline **+** auto-schedule into free window (drag to adjust) |
| Work hours source | Self-contained, set in-app; schema sync-ready (no Google in v1) |
| Placement | New `/dashboard/plan` page; Today checklist untouched |
| Durations | Smart defaults, editable inline; persisted on the habit |
| Reminders | **In v1** (signed-in push + local in-page) |
| Adjust UX | **True drag/resize in v1** (Framer Motion, 5-min snap) |
| Audience | **Signed-in + local** in v1 |
| Rollout | Dark-launch behind PostHog flag `after-work-plan`, owner only |
| Ship floor | Core planner (schema, timeline, completion sync, auto-arrange, drag) must be solid before any prod ship; reminders + local parity are targets, can become a follow-up PR if not prod-ready |
| Deploy | Self-merge to `main` + deploy Convex & Cloudflare to prod; fall back to ready-to-merge PR if blocked |

## 4. Architecture overview

The Plan page is a **scheduling overlay** on top of existing habit data. It owns
*placement* (what time, how long); it never owns *completion* (that stays in
`habitEntries`). A block is "this habit, placed at a time today"; a block is "done"
iff its habit's entry for today is `completed`.

```
                ┌─────────────────────────────┐
  Today page ──▶│  habitEntries (completion)  │◀── Plan page (check a block)
                └─────────────────────────────┘
                              ▲
   Plan page placement ──▶ dayPlans + planBlocks (start/duration/reminders)
   Work hours ──▶ users.preferences.workSchedule (default) + dayPlans (per-day)
```

Two data backends behind one hook (mirrors the existing `use-habit-entries` pattern):
**Convex** for signed-in, **`lib/local-store`** for guests, branched on `isGuest`.

## 5. Data model

### 5.1 Convex schema additions (all additive / backwards-compatible)

**`users.preferences.workSchedule`** (optional object):
```ts
workSchedule: v.optional(v.object({
  defaultStart: v.string(),   // "HH:mm" local
  defaultEnd:   v.string(),   // "HH:mm" local
  windDownAt:   v.string(),   // "HH:mm" — end of the free window
  workdays:     v.array(v.number()), // 0=Sun … 6=Sat
}))
```

**`habitDefinitions`** — two optional fields:
```ts
estimatedMinutes: v.optional(v.number()),                 // editable; heuristic default if absent
defaultPlacement: v.optional(v.union(v.literal("timeline"), v.literal("anytime"))),
```

**`dayPlans`** (one per user per day):
```ts
dayPlans: defineTable({
  userId: v.id("users"),
  challengeId: v.id("challenges"),
  date: v.string(),               // ISO date in user's tz
  workStart: v.union(v.string(), v.null()), // "HH:mm" | null (day off / unset)
  workEnd:   v.union(v.string(), v.null()),
  windDownAt: v.string(),         // "HH:mm"
  arrangedAt: v.optional(v.number()),
})
  .index("by_user_date", ["userId", "date"])
  .index("by_user", ["userId"])
```

**`planBlocks`** (separate table — avoids full-doc rewrites on every drag, gives each
block a stable `_id` for reminder dedupe; per Convex guideline against high-churn
embedded arrays):
```ts
planBlocks: defineTable({
  userId: v.id("users"),
  dayPlanId: v.id("dayPlans"),
  date: v.string(),               // denormalized for cheap by-day + cron scans
  habitDefinitionId: v.optional(v.id("habitDefinitions")), // null for custom/break/busy
  kind: v.union(v.literal("habit"), v.literal("break"), v.literal("custom"), v.literal("busy")),
  title: v.optional(v.string()),  // for custom/break/busy; habit blocks read the habit's name
  startMin: v.number(),           // minutes from local midnight
  durationMin: v.number(),
  reminderEnabled: v.boolean(),
  reminderSentAt: v.optional(v.number()), // ms epoch; set when push delivered
  source: v.optional(v.string()), // reserved: "google" etc. for future sync
})
  .index("by_dayPlan", ["dayPlanId"])
  .index("by_user_date", ["userId", "date"])
  .index("by_date", ["date"])     // cron scan across users for due reminders
```

**`blockReminderDeliveries`** (dedupe, mirrors `notificationDeliveries` shape):
```ts
blockReminderDeliveries: defineTable({
  userId: v.id("users"),
  blockId: v.id("planBlocks"),
  localDate: v.string(),
  sentAt: v.number(),
}).index("by_block", ["blockId"]).index("by_user_date", ["userId", "localDate"])
```
> Reminder dedupe can use `planBlocks.reminderSentAt` directly; the deliveries table is
> kept for an auditable log + parity with the existing notification pattern. Final call
> made in impl-notes; one of the two is authoritative to avoid double-send.

### 5.2 Local-store mirror

Add `workSchedule` to the local preferences blob and `dayPlans` + `planBlocks` "tables"
to the single versioned localStorage document (`75proof:local:v1`), following the
existing local-store conventions (string `local_*` ids, `useSyncExternalStore`,
`notify()` after persist). Local blocks carry the same fields minus Convex ids.

## 6. Behavior

### 6.1 Seeding today's plan
On Plan page load for `date = today`:
1. Read the user's `dayPlan` for today.
2. If none and today is a workday (per `workSchedule.workdays`): create one seeded from
   `workSchedule` defaults, then **auto-arrange immediately** so the user lands on a
   ready plan. If no `workSchedule` exists yet, show a first-run "set your work hours"
   state instead of guessing.
3. If today is a non-workday, seed with `workStart/End = null` (free all day) and
   auto-arrange from `now`.

### 6.2 Duration & placement heuristics (defaults; user-editable)
`estimatedMinutes` default, in priority order:
- `blockType === "counter"` with a minutes unit → `target`.
- `blockType === "counter"` with `unit === "pages"` → `ceil(target * 1.5)` min.
- name/category fitness/workout → 45; meditation/breath → 10; journaling → 15;
  reading → 20; otherwise generic `task` → 15.

`defaultPlacement` default:
- `anytime` for binary "avoid/lifestyle" tasks (categories nutrition/discipline whose
  name implies abstinence — diet, no alcohol, no cheat) and any habit with no sensible
  duration.
- `timeline` otherwise. User can flip any habit between timeline ↔ anytime; the choice
  persists on the habit (`defaultPlacement`).

### 6.3 Auto-arrange (deterministic)
Inputs: `workEnd` (or `now` if no work today), `windDownAt`, `now`, the `timeline`
habits not already done (ordered by `habitDefinitions.sortOrder`) with their durations,
and any already-placed-and-done blocks (whose times are preserved).
```
cursor = ceilTo5(max(now, workEnd)) + 15  // 15-min decompression buffer after work
for each timeline habit not done, in sortOrder:
    place block [cursor, cursor + duration]
    cursor += duration + 10               // 10-min inter-block gap
if cursor > windDownAt:                    // overflow
    recompute with inter-block gap = 0 and buffer = 0
    if still over windDownAt: keep placement, set plan.overflow flag → UI shows
       "running past {windDownAt}" and lets the user trim/move
done blocks keep their stored times; arrange only (re)places not-done timeline habits
```
Pure function, no DB access → unit tested in isolation. "Auto-arrange" button re-runs it.

### 6.4 Adjust
- **Drag** a block vertically → change `startMin`, snapped to 5 min.
- **Resize** top/bottom edge → change `startMin`/`durationMin`, snapped to 5 min, min 5.
- Move a habit **timeline ↔ anytime tray** (updates `defaultPlacement` + adds/removes its block for today).
- Add a one-off `custom` or `break` block for today.
- Each edit patches a single `planBlocks` row (cheap, no contention).

### 6.5 Completion sync
Checking a block calls the **existing** habit completion mutation (signed-in: the Convex
toggle used by `DynamicDailyChecklist`; guest: the local-store equivalent), keyed by
`habitDefinitionId` + today. The block's done state is derived by reading the habit's
`habitEntries` row — no separate completion state on the block. Confetti / day-complete
logic already wired into the checklist remains the single celebration path.

### 6.6 Reminders
**Signed-in (real background push):**
- A Convex cron (`crons.interval`, every 1–2 min) runs an internal action that scans
  `planBlocks` by `date = today (per tz buckets)` for blocks where `reminderEnabled`,
  `reminderSentAt` is unset, the habit is not yet done, and `startMin` is within the
  send window (e.g. `[now, now+2min]` in the user's tz). It sends web-push via the
  existing push pipeline, then sets `reminderSentAt` + writes a `blockReminderDeliveries`
  row (idempotent guard against double fire).
- Reuses `pushSubscriptions`, the web-push send path, and the timezone/window logic
  already in `reminders.ts`.
- Per-block reminder toggle in the UI (default: on for timeline habit blocks).

**Local/guest (best-effort, honest):**
- No server → no background delivery (per `DECISIONS.md` #6). While the app is open, a
  client scheduler uses `setTimeout` + the `Notification` API to fire at block times.
  UI copy states reminders only fire while the app is open. Reuses the existing
  in-page notification-permission prompt.

## 7. Component / module breakdown (design for isolation)

**Pure logic (no DB, no React) — fully unit tested:**
- `lib/plan/auto-arrange.ts` — `autoArrange(input): Block[]`.
- `lib/plan/duration-heuristics.ts` — `defaultDuration(habit)`, `inferPlacement(habit)`.
- `lib/plan/time.ts` — minutes↔"HH:mm", snapTo5, nowMinutesInTz, clamp helpers.
  (Reuses `lib/day-utils` where one already exists.)

**Convex backend:**
- `convex/dayPlans.ts` — `getToday` (query, joins blocks + habit completion),
  `seedToday`, `setWorkHours`, `autoArrange`, `addBlock`, `moveBlock`, `resizeBlock`,
  `removeBlock`, `setBlockReminder`, `moveHabitPlacement`. Auth derived server-side
  (never accept `userId`).
- `convex/planReminders.ts` (or extend `reminders.ts`) — internal action + cron scan.
- `convex/schema.ts` — the additions in §5.1.

**Local-store mirror:**
- `lib/local-store/day-plans.ts` — same operations against the local blob.

**Hook (unifies both backends):**
- `hooks/use-day-plan.ts` — branches on `isGuest`; returns `{ plan, blocks, workHours,
  setWorkHours, autoArrange, moveBlock, resizeBlock, toggleBlockDone, ... }`.

**UI (`components/plan/`, theme-aware, calm/minimal):**
- `app/(dashboard)/dashboard/plan/page.tsx` — route + flag gate + data wiring.
- `WorkHoursBar.tsx` / `WorkHoursEditor.tsx` — collapsed bar + editor (time pickers, "use my usual", set-as-default).
- `PlanTimeline.tsx` — the spine, hour gutter, now-line.
- `TimelineBlock.tsx` — a draggable/resizable block (Framer Motion), check node, reminder toggle.
- `AnytimeTray.tsx` — check-only habits + add one-off.
- `PlanEmptyState.tsx` — first-run "set your work hours".

## 8. Feature flag & nav

- PostHog flag key: **`after-work-plan`**. Read client-side via `useFeatureFlagEnabled`
  (same pattern as `DashboardTour`'s `show-onboarding-tour`).
- Targeting: enabled only for the owner's person (by email/identified distinct id).
- Gate **both**: the nav entry (sidebar + mobile bottom nav) and the page itself (if
  flag off, `/dashboard/plan` redirects to `/dashboard`).

## 9. Testing strategy (maximum)

- **Vitest setup:** add `vitest`, `convex-test`, `@edge-runtime/vm`, `jsdom`,
  `@testing-library/react`. Two projects: `edge-runtime` (Convex fns via `convex-test`)
  and `node`/`jsdom` (pure logic + components). Scripts: `test`, `test:watch`.
- **Unit (pure logic):** exhaustive cases for `autoArrange` (overflow, done-preservation,
  no-work day, empty habits, buffer/gap math), `duration-heuristics`, `time` math.
- **Integration (convex-test):** seed → set work hours → auto-arrange → move/resize →
  toggle done (writes habitEntries) → reminder cron marks sent + dedupes. Auth-scoping
  (a user can't touch another's plan).
- **Automated UI:** start `convex dev` + `next dev`; drive the flows in a real browser
  (set hours, auto-arrange, drag a block, resize, check off → verify Today reflects it,
  toggle a reminder) at desktop **and** mobile viewport; check theme-awareness + basic a11y.
- **Build gate:** `npx next build` must pass before commit/deploy.

## 10. Deploy plan

1. All commits on `feat/after-work-plan-timeline`, PR-sized and green.
2. `npx convex deploy` → prod (schema additions + functions + cron). Additive, safe.
3. Create the `after-work-plan` PostHog flag, owner-targeted, **before** the frontend is live.
4. `opennextjs-cloudflare deploy` (`pnpm deploy`) → prod frontend.
5. Open PR (assignee `@me`, reviewer `radroid`), then `gh pr merge --admin --squash`.
6. Verify: owner sees Plan in nav and the page works; a non-flagged path 404/redirects.

## 11. Risks & mitigations

- **True touch drag is the hardest part.** Mitigate: Framer Motion (already a dep),
  5-min snapping, generous hit targets, and a tap-to-edit fallback (time steppers) so
  the feature is usable even if drag feels rough on a given device.
- **End-to-end background push not verifiable overnight** (needs the owner's device
  subscribed). Mitigate: prove the pipeline via convex-test + a simulated subscription;
  flag the real-device check as a morning follow-up.
- **Convex prod cron starts running immediately.** Safe: it finds no enabled blocks
  until the feature is used; gated UI means only the owner creates blocks.
- **Local-mode parity doubles the data layer.** If it can't reach prod quality tonight,
  it drops to a follow-up PR per the agreed ship floor (core planner is the gate).
- **PostHog person targeting** depends on how the app identifies persons; confirmed in
  recon before creating the flag. Fallback: ship the page gated by a temporary
  allowlist on the owner's Clerk id if flag targeting is uncertain.

## 12. Out-of-scope follow-ups (post-v1)
Google Calendar sync; multi-day planning; auto dinner-break; reminder snooze; weekly
"upcoming targets" view (pairs with backlog H-5 habit cadence); per-block notes/photos.
