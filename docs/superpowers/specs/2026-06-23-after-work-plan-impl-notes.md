# After-Work Plan — Implementation Notes (code-level)

Companion to `2026-06-23-after-work-plan-timeline-design.md`. Exact identifiers from recon.

## Auth (convex/lib/auth.ts)
- `getAuthenticatedUser(ctx): Promise<Doc<"users">>` — resolves via `ctx.auth.getUserIdentity()` →
  `users.withIndex("by_clerk_id", q => q.eq("clerkId", identity.subject)).unique()`. Throws if unauthed.
- Use in ALL new Convex queries/mutations. Never accept `userId` for auth in new code.

## Completion sync (reuse existing — do NOT reinvent)
- Signed-in toggle: `api.habitEntries.toggleTaskEntry` — args `{ habitDefinitionId, challengeId, userId, dayNumber, date, userTimezone }` (legacy signature keeps userId arg).
- Counter update: `handleUpdateCounter` path in `hooks/use-habit-entries.ts`.
- Guest toggle: `localToggleTask({ habitDefinitionId, challengeId, dayNumber, date })` from `lib/local-store/mutations`.
- **Plan page composes `useHabitEntries` for completion** (it already branches guest/convex + handles task/counter, builds `entryMap` keyed by `habitDefinitionId` with `{completed, value}`). Block "done" = `entryMap.get(habitId)?.completed`. Check = `handleToggleTask(habitId)`.
- Habit defs query: `api.habitDefinitions.getActiveHabitDefinitions({ challengeId })`; entries: `api.habitEntries.getEntriesForDay({ challengeId, dayNumber })`.

## Day/time (convex/lib/dayCalculation.ts + lib/day-utils.ts)
- `getTodayInTimezone(tz) -> "YYYY-MM-DD"`, `getUserTimezone()` (client), `computeDayNumber(startDate, today)`, `getDateForDay`.
- Time-of-day in `convex/reminders.ts`: `parseHHmm("HH:mm") -> minutes`, `getLocalHHmm(tz, now) -> "HH:mm"` (DST-safe Intl).
- **Plan: extract `parseHHmm` + `getLocalHHmm` into `convex/lib/dayCalculation.ts`** (shared), mirror client helpers in `lib/plan/time.ts` (`nowMinutesInTz`, `minToHHmm`, `hhmmToMin`, `snapTo5`).

## Local store (lib/local-store/)
- Single doc key `75proof:local:v1`, version 1. Files: `db.ts` (LocalDB interface + `emptyDB()`), `store.ts` (`localStore.write(draft=>{})` deep-clones via structuredClone, persist, `notify()`; `genId(table)` => `local_<table>_<ts36>_<rand>`), `hooks.ts` (`useLocalDB()` via `useSyncExternalStore`; selector hooks), `mutations.ts`, `notifications.ts`.
- Add to `db.ts`: `LocalUserPreferences.workSchedule?`, tables `dayPlans: LocalDayPlan[]`, `planBlocks: LocalPlanBlock[]`; init in `emptyDB()`.
- **MIGRATION GOTCHA:** existing stored docs predate new arrays → on load, merge loaded over `emptyDB()` defaults (or default `db.dayPlans ?? []` in every selector) so `.dayPlans`/`.planBlocks` are never `undefined`. Verify store load path; add a backfill if it doesn't already spread defaults.
- `useLocalHydrationComplete()` gates first read (SSR returns empty snapshot).

## Reminders (convex/reminders.ts, crons.ts, pushActions.ts, pushSubscriptions.ts)
- Existing cron: `crons.interval("send due push reminders", { minutes: 15 }, internal.reminders.dispatchDueReminders)`.
- Pattern: iterate `users.take(1000)`; per user compute local "HH:mm" via Intl; `isInWindow(target, now)`=`target>=now && target<now+WINDOW`; dedupe via `notificationDeliveries` `by_user_slot_date`; `recordDelivery` idempotent; `scheduler.runAfter(0, internal.pushActions.sendReminderPush, {userId, slot})`.
- Push: `internal.pushSubscriptions.listSubscriptionsForUser({userId})` (by_user, enabled), `webpush.sendNotification(...)`, prune 404/410.
- **Block reminders (new `convex/planReminders.ts`):** add `blockReminderDeliveries` table (`by_block`, `by_user_date`); `crons.interval("send due block reminders", { minutes: 1 }, internal.planReminders.dispatchDueBlockReminders)` with a 2-min window; per user query today's `planBlocks` where `reminderEnabled && !reminderSentAt && habit not done && startMin in window`; send via a `sendBlockReminderPush` payload (title=habit name, body=time, data.url="/dashboard/plan"); set `reminderSentAt` + delivery row. Early-return users without a workSchedule to keep the scan cheap.
- Local: no background push (DECISIONS #6). `lib/local-store/notifications.ts` has `requestLocalNotificationPermission()`, `detectPermission()`. Local block reminders = `setTimeout` + `new Notification(...)` while app open; UI says so.

## Nav (app/(dashboard)/layout.tsx + components/ui/mobile-bottom-nav.tsx)
- Sidebar authed `navItems` (~L312-328): add `{ label: "Plan", href: "/dashboard/plan", icon: <Calendar className="h-5 w-5 flex-shrink-0" /> }`.
- Mobile `defaultNavItems` (~L58-79): add `{ label: "Plan", href: "/dashboard/plan", icon: Calendar }` (icon is a component, not JSX). Mobile slots are tight — gate behind flag so it only appears when enabled.
- Active highlight auto (`usePathname`). Route: `app/(dashboard)/dashboard/plan/page.tsx`, wrap in `<PageContainer>`.

## Themes (semantic tokens only)
- `useThemePersonality()` → "arctic"|"broadsheet"|"military"|"zen". Build with Tailwind semantic classes: `bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-muted`, `bg-success`/`text-success-foreground`, `bg-primary`, `ring-ring`, `rounded-[var(--radius)]`. Headings: `style={{ fontFamily: "var(--font-heading)" }}`. Motion: `useReducedMotion()`. `cn()` from `lib/utils`. NEVER hardcode hex.
- Calm/minimal mapping: surface=`bg-background`/`bg-card`, hairlines=`border-border`, secondary=`text-muted-foreground`, single accent=`bg-success`(done)/`text-success`, primary used sparingly.

## Feature flag (PostHog)
- `useFeatureFlagEnabled("after-work-plan")` from `posthog-js/react`; call unconditionally; returns `boolean|undefined`.
- PostHog only inits in prod OR `NEXT_PUBLIC_POSTHOG_FORCE_ENABLE=1`. **Dev/test bypass:** gate = `flag || process.env.NODE_ENV !== "production"` so local UI testing works; prod = flag only.
- Persons identified by `posthog.identify(clerkUser.id, { email, ... })` (PostHogUserIdentifier.tsx). Create flag targeted to owner email `raj9dholakia@gmail.com`. Guests aren't identified → local-mode users won't get the prod flag (acceptable for owner-only dark launch; verify local parity via dev bypass).

## Build / test / deploy
- Codegen after new Convex fns: `npx convex dev --once` (push to dev deployment + regen `convex/_generated`). Then `npx next build` must pass.
- Vitest: workspace with 2 projects — `convex` (environment "edge-runtime", `@edge-runtime/vm`, convex-test, `convex/**/*.test.ts`) and `unit` (jsdom, `@testing-library/react`, `lib/**/*.test.ts` + `components/**/*.test.tsx`).
- Deploy prod: `npx convex deploy` (device-authed) then `bun run deploy` (opennextjs-cloudflare build && deploy, wrangler authed). PR merge: `gh pr merge --admin --squash` (owner radroid).
