import { v } from "convex/values";
import {
  internalAction,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";
import { getTodayInTimezone } from "./lib/dayCalculation";

/**
 * Window width the cron runs on, in minutes. Must match the cron interval in
 * `convex/crons.ts`. If the cron runs every 15 minutes, we treat any user
 * whose configured reminder time falls within the next 15-minute slot as due.
 */
const WINDOW_MINUTES = 15;

/** Parse "HH:mm" -> total minutes from midnight. Returns null on bad input. */
function parseHHmm(s: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s);
  if (!m) return null;
  const h = Number(m[1]);
  const mm = Number(m[2]);
  if (!Number.isFinite(h) || !Number.isFinite(mm)) return null;
  if (h < 0 || h > 23 || mm < 0 || mm > 59) return null;
  return h * 60 + mm;
}

/**
 * Get the current local HH:mm in the given IANA timezone using Intl. This is
 * DST-safe because Intl handles the transition for us.
 */
function getLocalHHmm(tz: string, now: Date): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: tz,
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    }).format(now);
  } catch {
    // Fall back to UTC if the tz is invalid — better than crashing the cron.
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: "UTC",
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    }).format(now);
  }
}

/**
 * A minute-of-day is "in the current cron window" if it's >= the current
 * local minute and < current + WINDOW_MINUTES. We intentionally do NOT wrap
 * across midnight: reminder times set to 00:00-00:14 with a cron tick at
 * 23:55 won't fire until the next tick — that's fine (reminders aren't
 * mission-critical, and avoiding wrap keeps the logic simple and safe).
 */
function isInWindow(targetMin: number, nowMin: number): boolean {
  return targetMin >= nowMin && targetMin < nowMin + WINDOW_MINUTES;
}

export type ReminderSlot = "morning" | "evening";

/**
 * Fetch candidate users and decide who is due for which slot right now.
 * Runs as a single query (transactional) so we don't race with pref edits.
 *
 * Returns a bounded list of (userId, slot, localDate) tuples. The action
 * then fans out per-user pushes.
 */
export const findDueReminders = internalQuery({
  args: {},
  handler: async (
    ctx
  ): Promise<
    Array<{
      userId: Id<"users">;
      slot: ReminderSlot;
      localDate: string;
      timezone: string;
    }>
  > => {
    const now = new Date();
    // Upper bound on users per run. If the user base grows huge we'd paginate
    // or index on notifications.enabled; for now take(1000) is safe.
    const users = await ctx.db.query("users").take(1000);

    const due: Array<{
      userId: Id<"users">;
      slot: ReminderSlot;
      localDate: string;
      timezone: string;
    }> = [];

    for (const user of users) {
      const notif = user.preferences.notifications;
      if (!notif || !notif.enabled) continue;
      const tz = user.preferences.timezone || "UTC";
      const nowHHmm = getLocalHHmm(tz, now);
      const nowMin = parseHHmm(nowHHmm);
      if (nowMin === null) continue;
      const localDate = getTodayInTimezone(tz);

      if (notif.morningReminder) {
        const target = parseHHmm(notif.morningTime);
        if (target !== null && isInWindow(target, nowMin)) {
          due.push({ userId: user._id, slot: "morning", localDate, timezone: tz });
        }
      }
      if (notif.eveningReminder) {
        const target = parseHHmm(notif.eveningTime);
        if (target !== null && isInWindow(target, nowMin)) {
          due.push({ userId: user._id, slot: "evening", localDate, timezone: tz });
        }
      }
    }

    return due;
  },
});

/**
 * Internal query: has the user already received today's reminder for this
 * slot in this local date?
 */
export const hasDeliveryFor = internalQuery({
  args: {
    userId: v.id("users"),
    slot: v.union(v.literal("morning"), v.literal("evening")),
    localDate: v.string(),
  },
  handler: async (ctx, args): Promise<boolean> => {
    const existing = await ctx.db
      .query("notificationDeliveries")
      .withIndex("by_user_slot_date", (q) =>
        q
          .eq("userId", args.userId)
          .eq("slot", args.slot)
          .eq("localDate", args.localDate)
      )
      .unique();
    return existing !== null;
  },
});

/**
 * Record that a reminder was sent. Idempotent: if a row already exists we
 * return the existing id rather than throwing. Called by the action right
 * before web-push to ensure we don't double-send even if the action retries.
 */
export const recordDelivery = internalMutation({
  args: {
    userId: v.id("users"),
    slot: v.union(v.literal("morning"), v.literal("evening")),
    localDate: v.string(),
  },
  handler: async (ctx, args): Promise<Id<"notificationDeliveries">> => {
    const existing = await ctx.db
      .query("notificationDeliveries")
      .withIndex("by_user_slot_date", (q) =>
        q
          .eq("userId", args.userId)
          .eq("slot", args.slot)
          .eq("localDate", args.localDate)
      )
      .unique();
    if (existing) return existing._id;
    return await ctx.db.insert("notificationDeliveries", {
      userId: args.userId,
      slot: args.slot,
      localDate: args.localDate,
      sentAt: Date.now(),
    });
  },
});

/**
 * Internal query: has the user already completed today? Used by the evening
 * reminder to skip users who are already done. Morning is always sent as a
 * "start the day" nudge. Handles both the new habit system (hard-only) and
 * the legacy dailyLogs system.
 */
export const isDayAlreadyComplete = internalQuery({
  args: {
    userId: v.id("users"),
    localDate: v.string(),
  },
  handler: async (ctx, args): Promise<boolean> => {
    const activeChallenge = await ctx.db
      .query("challenges")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .unique();

    if (activeChallenge) {
      const habitDefs = await ctx.db
        .query("habitDefinitions")
        .withIndex("by_challenge", (q) => q.eq("challengeId", activeChallenge._id))
        .collect();
      if (habitDefs.length > 0) {
        const hardHabits = habitDefs.filter((h) => h.isActive && h.isHard);
        if (hardHabits.length === 0) return false;
        const entries = await ctx.db
          .query("habitEntries")
          .withIndex("by_challenge_day", (q) =>
            q
              .eq("challengeId", activeChallenge._id)
              .eq("dayNumber", activeChallenge.currentDay)
          )
          .collect();
        const entryMap = new Map(
          entries.map((e) => [String(e.habitDefinitionId), e])
        );
        return hardHabits.every(
          (h) => entryMap.get(String(h._id))?.completed === true
        );
      }
    }

    const log: Doc<"dailyLogs"> | null = await ctx.db
      .query("dailyLogs")
      .withIndex("by_date", (q) =>
        q.eq("userId", args.userId).eq("date", args.localDate)
      )
      .unique();
    return !!log?.allRequirementsMet;
  },
});

/**
 * The cron entry point. Scans for users whose reminder time falls in the
 * current window and hasn't been delivered yet, and schedules the node
 * action to fan out per user. Kept small so the transaction is fast.
 */
export const dispatchDueReminders = internalAction({
  args: {},
  handler: async (ctx): Promise<{ scheduled: number; skipped: number }> => {
    const due: Array<{
      userId: Id<"users">;
      slot: ReminderSlot;
      localDate: string;
      timezone: string;
    }> = await ctx.runQuery(internal.reminders.findDueReminders, {});

    let scheduled = 0;
    let skipped = 0;

    for (const item of due) {
      const already: boolean = await ctx.runQuery(
        internal.reminders.hasDeliveryFor,
        {
          userId: item.userId,
          slot: item.slot,
          localDate: item.localDate,
        }
      );
      if (already) {
        skipped++;
        continue;
      }

      // Skip evening reminder if the user already completed today.
      if (item.slot === "evening") {
        const done: boolean = await ctx.runQuery(
          internal.reminders.isDayAlreadyComplete,
          { userId: item.userId, localDate: item.localDate }
        );
        if (done) {
          skipped++;
          continue;
        }
      }

      // Reserve the delivery row BEFORE dispatching the push — this closes
      // the race window where two overlapping cron runs might both decide
      // the same user is due.
      await ctx.runMutation(internal.reminders.recordDelivery, {
        userId: item.userId,
        slot: item.slot,
        localDate: item.localDate,
      });

      await ctx.scheduler.runAfter(0, internal.pushActions.sendReminderPush, {
        userId: item.userId,
        slot: item.slot,
      });
      scheduled++;
    }

    return { scheduled, skipped };
  },
});
