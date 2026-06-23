import { v } from "convex/values";
import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import {
  getTodayInTimezone,
  getLocalHHmm,
  parseHHmm,
  computeDayNumber,
} from "./lib/dayCalculation";

/**
 * Per-block plan reminders. Mirrors the morning/evening reminder pipeline in
 * `reminders.ts`, but keyed on individual scheduled `planBlocks`. Runs on a
 * tighter cadence so a "6:30 Workout" reminder lands close to its time.
 *
 * Local/guest users get NO background push (see DECISIONS #6) — they rely on
 * an in-page reminder while the app is open. This server path is signed-in only.
 */

// A block is "due" if its start time is at most LOOKAHEAD minutes ahead of now
// or up to GRACE minutes in the past. The cron fires every 5 minutes (crons.ts);
// the GRACE tail is intentionally LARGER than the interval so that two adjacent
// firings overlap — if one tick is delayed or skipped (cron jitter/backpressure),
// the next still catches blocks whose minute would otherwise fall in a gap.
// reminderSentAt + blockReminderDeliveries dedupe the overlap to a single send.
const LOOKAHEAD_MIN = 5;
const GRACE_MIN = 10;

function isDue(targetMin: number, nowMin: number): boolean {
  return targetMin <= nowMin + LOOKAHEAD_MIN && targetMin > nowMin - GRACE_MIN;
}

/** 12h clock label for the notification body, e.g. 870 -> "2:30 PM". */
function clockLabel(min: number): string {
  const v2 = ((Math.round(min) % 1440) + 1440) % 1440;
  const h24 = Math.floor(v2 / 60);
  const m = v2 % 60;
  const period = h24 < 12 ? "AM" : "PM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

interface DueBlock {
  userId: Id<"users">;
  blockId: Id<"planBlocks">;
  localDate: string;
  title: string;
  body: string;
}

/**
 * Find scheduled blocks whose start time is in the current window and haven't
 * been notified. Gated to users who have a saved work schedule (a cheap proxy
 * for "uses the Plan feature") and haven't globally disabled notifications.
 */
export const findDueBlockReminders = internalQuery({
  args: {},
  handler: async (ctx): Promise<DueBlock[]> => {
    const now = new Date();
    const users = await ctx.db.query("users").take(1000);
    const due: DueBlock[] = [];

    for (const user of users) {
      if (!user.preferences.workSchedule) continue;
      const notif = user.preferences.notifications;
      if (notif && notif.enabled === false) continue;

      const tz = user.preferences.timezone || "UTC";
      const nowMin = parseHHmm(getLocalHHmm(tz, now));
      if (nowMin === null) continue;
      const localDate = getTodayInTimezone(tz);

      // Today's day number for the active challenge — used to skip habits the
      // user already completed (don't nag for done work; mirrors reminders.ts).
      const challenge = user.currentChallengeId
        ? await ctx.db.get(user.currentChallengeId)
        : null;
      const dayNumber = challenge
        ? computeDayNumber(challenge.startDate, localDate)
        : null;

      const blocks = await ctx.db
        .query("planBlocks")
        .withIndex("by_user_date", (q) =>
          q.eq("userId", user._id).eq("date", localDate),
        )
        .take(100);

      for (const b of blocks) {
        if (b.kind !== "habit") continue;
        if (!b.reminderEnabled || b.reminderSentAt) continue;
        if (!isDue(b.startMin, nowMin)) continue;

        const habitId = b.habitDefinitionId;
        if (habitId && dayNumber !== null) {
          const entry = await ctx.db
            .query("habitEntries")
            .withIndex("by_habit_day", (q) =>
              q.eq("habitDefinitionId", habitId).eq("dayNumber", dayNumber),
            )
            .first();
          if (entry?.completed) continue; // already done — no reminder
        }

        const habit = habitId ? await ctx.db.get(habitId) : null;
        const name = habit?.name ?? b.title ?? "Your habit";
        due.push({
          userId: user._id,
          blockId: b._id,
          localDate,
          title: name,
          body: `Scheduled for ${clockLabel(b.startMin)}`,
        });
      }
    }

    return due;
  },
});

/**
 * Reserve a block's reminder. Returns true only if THIS call set the flag —
 * the dispatcher sends the push only when it wins the reservation, closing the
 * double-send race between overlapping cron runs.
 */
export const reserveBlockReminder = internalMutation({
  args: { blockId: v.id("planBlocks"), localDate: v.string() },
  handler: async (ctx, args): Promise<boolean> => {
    const block = await ctx.db.get(args.blockId);
    if (!block) return false;
    if (block.reminderSentAt) return false;
    const sentAt = Date.now();
    await ctx.db.patch(args.blockId, { reminderSentAt: sentAt });
    await ctx.db.insert("blockReminderDeliveries", {
      userId: block.userId,
      blockId: args.blockId,
      localDate: args.localDate,
      sentAt,
    });
    return true;
  },
});

/** Cron entry point: dispatch due per-block reminders. */
export const dispatchDueBlockReminders = internalAction({
  args: {},
  handler: async (ctx): Promise<{ scheduled: number; skipped: number }> => {
    const due: DueBlock[] = await ctx.runQuery(
      internal.planReminders.findDueBlockReminders,
      {},
    );

    let scheduled = 0;
    let skipped = 0;

    for (const item of due) {
      const reserved: boolean = await ctx.runMutation(
        internal.planReminders.reserveBlockReminder,
        { blockId: item.blockId, localDate: item.localDate },
      );
      if (!reserved) {
        skipped++;
        continue;
      }
      await ctx.scheduler.runAfter(
        0,
        internal.pushActions.sendBlockReminderPush,
        { userId: item.userId, title: item.title, body: item.body },
      );
      scheduled++;
    }

    return { scheduled, skipped };
  },
});
