import { v, ConvexError } from "convex/values";
import { mutation, query, internalMutation, MutationCtx, QueryCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import {
  getTodayInTimezone,
  computeDayNumber,
  getDateForDay,
  getEditableDays,
  getReconciliationWindow,
  RECONCILIATION_WINDOW_DAYS,
} from "./lib/dayCalculation";

/**
 * Shared helper: check if a day is complete for a challenge.
 * Detects which system the challenge uses (legacy dailyLogs vs new habitEntries).
 */
async function isDayCompleteForChallenge(
  ctx: MutationCtx,
  challengeId: Id<"challenges">,
  dayNumber: number
): Promise<boolean> {
  // Check if challenge uses the new habit system
  const habitDefs = await ctx.db
    .query("habitDefinitions")
    .withIndex("by_challenge", (q) => q.eq("challengeId", challengeId))
    .collect();

  if (habitDefs.length > 0) {
    // New system: check all active hard habits have completed entries
    const hardHabits = habitDefs.filter((h) => h.isActive && h.isHard);
    if (hardHabits.length === 0) return true;

    const entries = await ctx.db
      .query("habitEntries")
      .withIndex("by_challenge_day", (q) =>
        q.eq("challengeId", challengeId).eq("dayNumber", dayNumber)
      )
      .collect();
    const entryMap = new Map(entries.map((e) => [e.habitDefinitionId, e]));

    for (const habit of hardHabits) {
      const entry = entryMap.get(habit._id);
      if (!entry || !entry.completed) return false;
    }
    return true;
  }

  // Legacy system: check dailyLogs
  const log = await ctx.db
    .query("dailyLogs")
    .withIndex("by_challenge_day", (q) =>
      q.eq("challengeId", challengeId).eq("dayNumber", dayNumber)
    )
    .unique();

  return !!log?.allRequirementsMet;
}

export const getActiveChallenge = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("challenges")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .unique();
  },
});

export const getChallenge = query({
  args: { challengeId: v.id("challenges") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.challengeId);
  },
});

export const getUserChallenges = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("challenges")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

// Per-day completion map for a challenge. Hard habits are required; soft habits
// are optional. Falls back to legacy `dailyLogs.allRequirementsMet` when the
// challenge has no habit definitions.
export const getDayCompletionMap = query({
  args: { challengeId: v.id("challenges") },
  handler: async (ctx, args) => {
    const challenge = await ctx.db.get(args.challengeId);
    if (!challenge) return {} as Record<number, boolean>;

    const habitDefs = await ctx.db
      .query("habitDefinitions")
      .withIndex("by_challenge", (q) => q.eq("challengeId", args.challengeId))
      .collect();

    const result: Record<number, boolean> = {};

    if (habitDefs.length > 0) {
      const hardHabits = habitDefs.filter((h) => h.isActive && h.isHard);
      const entries = await ctx.db
        .query("habitEntries")
        .withIndex("by_challenge_day", (q) => q.eq("challengeId", args.challengeId))
        .collect();

      const entriesByDay = new Map<number, Map<string, typeof entries[number]>>();
      for (const e of entries) {
        let byHabit = entriesByDay.get(e.dayNumber);
        if (!byHabit) {
          byHabit = new Map();
          entriesByDay.set(e.dayNumber, byHabit);
        }
        byHabit.set(String(e.habitDefinitionId), e);
      }

      for (let day = 1; day <= challenge.currentDay; day++) {
        if (hardHabits.length === 0) {
          result[day] = false;
          continue;
        }
        const byHabit = entriesByDay.get(day);
        const complete = !!byHabit && hardHabits.every((h) => {
          const entry = byHabit.get(String(h._id));
          return !!entry?.completed;
        });
        result[day] = complete;
      }
      return result;
    }

    const logs = await ctx.db
      .query("dailyLogs")
      .withIndex("by_challenge_day", (q) => q.eq("challengeId", args.challengeId))
      .collect();
    for (const log of logs) {
      result[log.dayNumber] = !!log.allRequirementsMet;
    }
    return result;
  },
});

export const startChallenge = mutation({
  args: {
    userId: v.id("users"),
    startDate: v.string(),
    visibility: v.union(
      v.literal("private"),
      v.literal("friends"),
      v.literal("public")
    ),
  },
  handler: async (ctx, args) => {
    // Check if user already has an active challenge
    const existingChallenge = await ctx.db
      .query("challenges")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .unique();

    if (existingChallenge) {
      throw new Error("User already has an active challenge");
    }

    // Create new challenge
    const challengeId = await ctx.db.insert("challenges", {
      userId: args.userId,
      startDate: args.startDate,
      currentDay: 1,
      status: "active",
      visibility: args.visibility,
      restartCount: 0,
    });

    // Update user's current challenge
    await ctx.db.patch(args.userId, {
      currentChallengeId: challengeId,
    });

    // Create activity feed entry
    await ctx.db.insert("activityFeed", {
      userId: args.userId,
      type: "challenge_started",
      challengeId,
      message: "Started the 75 HARD challenge!",
      createdAt: new Date().toISOString(),
    });

    return challengeId;
  },
});

export const advanceDay = mutation({
  args: { challengeId: v.id("challenges") },
  handler: async (ctx, args) => {
    const challenge = await ctx.db.get(args.challengeId);
    if (!challenge) {
      throw new Error("Challenge not found");
    }

    if (challenge.status !== "active") {
      throw new Error("Challenge is not active");
    }

    const newDay = challenge.currentDay + 1;

    if (newDay > 75) {
      // Challenge completed!
      await ctx.db.patch(args.challengeId, {
        currentDay: 75,
        status: "completed",
      });

      // Update longest streak on user record
      const user = await ctx.db.get(challenge.userId);
      const currentLongest = user?.longestStreak ?? 0;
      if (75 > currentLongest) {
        await ctx.db.patch(challenge.userId, { longestStreak: 75 });
      }

      await ctx.db.insert("activityFeed", {
        userId: challenge.userId,
        type: "challenge_completed",
        challengeId: args.challengeId,
        dayNumber: 75,
        message: "Completed the 75 HARD challenge! 🎉",
        createdAt: new Date().toISOString(),
      });
    } else {
      await ctx.db.patch(args.challengeId, {
        currentDay: newDay,
      });

      // Check for milestones
      const milestones = [7, 14, 21, 30, 45, 60];
      if (milestones.includes(newDay - 1)) {
        await ctx.db.insert("activityFeed", {
          userId: challenge.userId,
          type: "milestone",
          challengeId: args.challengeId,
          dayNumber: newDay - 1,
          message: `Reached Day ${newDay - 1} of 75 HARD!`,
          createdAt: new Date().toISOString(),
        });
      }
    }
  },
});

export const failChallenge = mutation({
  args: {
    challengeId: v.id("challenges"),
    failedOnDay: v.number(),
  },
  handler: async (ctx, args) => {
    await failChallengeInternal(ctx, args.challengeId, args.failedOnDay);
  },
});

/** Shared helper: fail a challenge and clean up. Used by both the public mutation and auto-reset. */
async function failChallengeInternal(
  ctx: MutationCtx,
  challengeId: Id<"challenges">,
  failedOnDay: number
) {
  const challenge = await ctx.db.get(challengeId);
  if (!challenge) {
    throw new Error("Challenge not found");
  }

  await ctx.db.patch(challengeId, {
    status: "failed",
    failedOnDay,
    restartCount: (challenge.restartCount ?? 0) + 1,
  });

  // Update lifetime stats on user record
  const user = await ctx.db.get(challenge.userId);
  const streakFromAttempt = Math.max(failedOnDay - 1, 0);
  const currentLongest = user?.longestStreak ?? 0;
  await ctx.db.patch(challenge.userId, {
    currentChallengeId: undefined,
    lifetimeRestartCount: (user?.lifetimeRestartCount ?? 0) + 1,
    longestStreak: Math.max(currentLongest, streakFromAttempt),
  });

  await ctx.db.insert("activityFeed", {
    userId: challenge.userId,
    type: "challenge_failed",
    challengeId,
    dayNumber: failedOnDay,
    message: `Challenge ended on Day ${failedOnDay}. Ready to start again!`,
    createdAt: new Date().toISOString(),
  });
}

/**
 * Lazy-eval challenge status check. Called on client visit.
 *
 * Returns one of:
 *   - `{ status: "active" }`
 *   - `{ status: "completed" }`
 *   - `{ status: "failed", failedOnDay }` — only when a day went >7 days
 *     without completion (cron usually beats us here, but this is a
 *     belt-and-suspenders path for stale clients).
 *   - `{ status: "needs_reconciliation", missedDays, usesNewSystem,
 *     hasSoftHabits }` — any past day within the last 7 is incomplete and
 *     must be reconciled via the dialog.
 *   - `{ status: "not_found" }`
 */
export const checkChallengeStatus = mutation({
  args: {
    challengeId: v.id("challenges"),
    userTimezone: v.string(),
  },
  handler: async (ctx, args) => {
    const challenge = await ctx.db.get(args.challengeId);
    if (!challenge || challenge.status !== "active") {
      return { status: challenge?.status ?? "not_found" } as const;
    }

    const todayStr = getTodayInTimezone(args.userTimezone);
    const todayDayNumber = computeDayNumber(challenge.startDate, todayStr);

    // Pre-start (start date in the future): just sync and return active.
    if (todayDayNumber < 1) {
      const syncDay = 1;
      if (challenge.currentDay !== syncDay) {
        await ctx.db.patch(args.challengeId, { currentDay: syncDay });
      }
      return { status: "active" } as const;
    }

    // Hard-cap auto-fail: any day that's gone >7 days without completion
    // fails the challenge. Normally the cron has already handled this; we
    // re-check here so a stale client doesn't render a stale state.
    const hardCapUpperBound = Math.min(todayDayNumber - RECONCILIATION_WINDOW_DAYS - 1, 75);
    for (let day = 1; day <= hardCapUpperBound; day++) {
      const complete = await isDayCompleteForChallenge(ctx, args.challengeId, day);
      if (!complete) {
        await failChallengeInternal(ctx, args.challengeId, day);
        return { status: "failed", failedOnDay: day } as const;
      }
    }

    // Reconciliation scan: check the last 7 days (excluding today) for
    // incomplete days. If any, the client shows the dialog.
    const reconWindow = getReconciliationWindow(todayDayNumber);
    const missedDays: number[] = [];
    for (const day of reconWindow) {
      const complete = await isDayCompleteForChallenge(ctx, args.challengeId, day);
      if (!complete) missedDays.push(day);
    }

    if (missedDays.length > 0) {
      const habitDefs = await ctx.db
        .query("habitDefinitions")
        .withIndex("by_challenge", (q) => q.eq("challengeId", args.challengeId))
        .collect();
      const usesNewSystem = habitDefs.length > 0;
      const hasSoftHabits = habitDefs.some((h) => h.isActive && !h.isHard);
      return {
        status: "needs_reconciliation",
        missedDays,
        usesNewSystem,
        hasSoftHabits,
      } as const;
    }

    // All past days within the window are complete — check for challenge
    // completion if today is past Day 75.
    if (todayDayNumber > 75) {
      let allComplete = true;
      for (let day = hardCapUpperBound + 1; day <= 75; day++) {
        const complete = await isDayCompleteForChallenge(ctx, args.challengeId, day);
        if (!complete) {
          allComplete = false;
          break;
        }
      }

      if (allComplete) {
        await ctx.db.patch(args.challengeId, {
          currentDay: 75,
          status: "completed",
        });

        const user = await ctx.db.get(challenge.userId);
        const currentLongest = user?.longestStreak ?? 0;
        if (75 > currentLongest) {
          await ctx.db.patch(challenge.userId, { longestStreak: 75 });
        }

        await ctx.db.insert("activityFeed", {
          userId: challenge.userId,
          type: "challenge_completed",
          challengeId: args.challengeId,
          dayNumber: 75,
          message: "Completed the 75 HARD challenge!",
          createdAt: new Date().toISOString(),
        });
        return { status: "completed" } as const;
      }
    }

    // Sync currentDay.
    const syncDay = Math.min(Math.max(todayDayNumber, 1), 75);
    if (challenge.currentDay !== syncDay) {
      await ctx.db.patch(args.challengeId, { currentDay: syncDay });
    }

    return { status: "active" } as const;
  },
});

/** Cron-callable: check all active challenges for days past the 7-day hard cap.
 *  This is the only auto-fail path on the happy path — users inside the 7-day
 *  window resolve via the reconciliation dialog on next visit. */
export const checkAllActiveChallenges = internalMutation({
  args: {},
  handler: async (ctx) => {
    const activeChallenges = await ctx.db
      .query("challenges")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    for (const challenge of activeChallenges) {
      const user = await ctx.db.get(challenge.userId);
      const tz = user?.preferences?.timezone ?? "UTC";

      const todayStr = getTodayInTimezone(tz);
      const todayDayNumber = computeDayNumber(challenge.startDate, todayStr);

      const hardCapUpperBound = Math.min(
        todayDayNumber - RECONCILIATION_WINDOW_DAYS - 1,
        75
      );
      if (hardCapUpperBound < 1) {
        const syncDay = Math.min(Math.max(todayDayNumber, 1), 75);
        if (challenge.currentDay !== syncDay) {
          await ctx.db.patch(challenge._id, { currentDay: syncDay });
        }
        continue;
      }

      let failed = false;
      for (let day = 1; day <= hardCapUpperBound; day++) {
        const complete = await isDayCompleteForChallenge(ctx, challenge._id, day);
        if (!complete) {
          await failChallengeInternal(ctx, challenge._id, day);
          failed = true;
          break;
        }
      }

      if (!failed) {
        const syncDay = Math.min(Math.max(todayDayNumber, 1), 75);
        if (challenge.currentDay !== syncDay) {
          await ctx.db.patch(challenge._id, { currentDay: syncDay });
        }
      }
    }
  },
});

/**
 * Self-attested backfill for missed days within the 7-day reconciliation
 * window. Writes completion state per-day in whichever habit system the
 * challenge uses, and emits `activityFeed` rows flagged `backfilled: true`
 * so friend/public feeds can filter them out.
 *
 * `mode === "hard"`: marks hard tasks/habits complete.
 * `mode === "all"`: also marks soft habits complete (new system only;
 * legacy `dailyLogs` challenges have no soft concept).
 *
 * Idempotent — re-running with the same args is a no-op beyond syncing.
 */
export const reconcileMissedDays = mutation({
  args: {
    challengeId: v.id("challenges"),
    missedDays: v.array(v.number()),
    mode: v.union(v.literal("hard"), v.literal("all")),
    userTimezone: v.string(),
  },
  handler: async (ctx, args) => {
    const challenge = await ctx.db.get(args.challengeId);
    if (!challenge) throw new ConvexError({ code: "NOT_FOUND", message: "Challenge not found" });
    if (challenge.status !== "active") {
      throw new ConvexError({
        code: "NOT_ACTIVE",
        message: "Challenge is not active",
      });
    }

    const todayStr = getTodayInTimezone(args.userTimezone);
    const todayDayNumber = computeDayNumber(challenge.startDate, todayStr);
    const validDays = new Set(getReconciliationWindow(todayDayNumber));

    for (const day of args.missedDays) {
      if (!validDays.has(day)) {
        throw new ConvexError({
          code: "OUT_OF_WINDOW",
          message: `Day ${day} is outside the reconciliation window.`,
        });
      }
    }

    const habitDefs = await ctx.db
      .query("habitDefinitions")
      .withIndex("by_challenge", (q) => q.eq("challengeId", args.challengeId))
      .collect();
    const usesNewSystem = habitDefs.length > 0;

    const nowIso = new Date().toISOString();
    const backfilled: number[] = [];

    for (const dayNumber of args.missedDays) {
      const dateStr = getDateForDay(challenge.startDate, dayNumber);

      if (usesNewSystem) {
        for (const habit of habitDefs) {
          if (!habit.isActive) continue;
          if (!habit.isHard && args.mode !== "all") continue;

          const existing = await ctx.db
            .query("habitEntries")
            .withIndex("by_habit_day", (q) =>
              q.eq("habitDefinitionId", habit._id).eq("dayNumber", dayNumber)
            )
            .unique();

          const completionValue =
            habit.blockType === "counter" && habit.target ? habit.target : undefined;

          if (existing) {
            await ctx.db.patch(existing._id, {
              completed: true,
              ...(completionValue !== undefined ? { value: completionValue } : {}),
            });
          } else {
            await ctx.db.insert("habitEntries", {
              habitDefinitionId: habit._id,
              challengeId: args.challengeId,
              userId: challenge.userId,
              dayNumber,
              date: dateStr,
              completed: true,
              ...(completionValue !== undefined ? { value: completionValue } : {}),
            });
          }
        }
      } else {
        const existing = await ctx.db
          .query("dailyLogs")
          .withIndex("by_challenge_day", (q) =>
            q.eq("challengeId", args.challengeId).eq("dayNumber", dayNumber)
          )
          .unique();

        const syntheticWorkout1 = {
          type: "other" as const,
          name: "Workout (backfilled)",
          durationMinutes: 45,
          isOutdoor: false,
        };
        const syntheticWorkout2 = {
          type: "other" as const,
          name: "Outdoor workout (backfilled)",
          durationMinutes: 45,
          isOutdoor: true,
        };

        if (existing) {
          await ctx.db.patch(existing._id, {
            workout1: existing.workout1 ?? syntheticWorkout1,
            workout2: existing.workout2 ?? syntheticWorkout2,
            outdoorWorkoutCompleted: true,
            dietFollowed: true,
            noAlcohol: true,
            waterIntakeOz: Math.max(existing.waterIntakeOz ?? 0, 128),
            readingMinutes: Math.max(existing.readingMinutes ?? 0, 20),
            allRequirementsMet: true,
            completedAt: existing.completedAt ?? nowIso,
          });
        } else {
          await ctx.db.insert("dailyLogs", {
            challengeId: args.challengeId,
            userId: challenge.userId,
            dayNumber,
            date: dateStr,
            workout1: syntheticWorkout1,
            workout2: syntheticWorkout2,
            outdoorWorkoutCompleted: true,
            dietFollowed: true,
            noAlcohol: true,
            waterIntakeOz: 128,
            readingMinutes: 20,
            allRequirementsMet: true,
            completedAt: nowIso,
          });
        }
      }

      // Emit a backfilled day_completed feed row, deduped per (user, challenge, day).
      const existingFeed = await ctx.db
        .query("activityFeed")
        .withIndex("by_user", (q) => q.eq("userId", challenge.userId))
        .filter((q) =>
          q.and(
            q.eq(q.field("type"), "day_completed"),
            q.eq(q.field("challengeId"), args.challengeId),
            q.eq(q.field("dayNumber"), dayNumber)
          )
        )
        .unique();

      if (!existingFeed) {
        await ctx.db.insert("activityFeed", {
          userId: challenge.userId,
          type: "day_completed",
          challengeId: args.challengeId,
          dayNumber,
          message: `Backfilled Day ${dayNumber}.`,
          createdAt: nowIso,
          backfilled: true,
        });
      } else if (!existingFeed.backfilled) {
        // Pre-existing feed row (shouldn't normally happen for an incomplete
        // day, but leave it alone — don't mutate a non-backfilled entry).
      }

      backfilled.push(dayNumber);
    }

    // Sync currentDay forward.
    const syncDay = Math.min(Math.max(todayDayNumber, 1), 75);
    if (challenge.currentDay !== syncDay) {
      await ctx.db.patch(args.challengeId, { currentDay: syncDay });
    }

    return { backfilledDays: backfilled };
  },
});

/** Query: return editable day numbers for the client's current day. */
export const getEditableWindow = query({
  args: {
    challengeId: v.id("challenges"),
    userTimezone: v.string(),
  },
  handler: async (ctx, args) => {
    const challenge = await ctx.db.get(args.challengeId);
    if (!challenge) return [];

    const todayStr = getTodayInTimezone(args.userTimezone);
    const todayDayNumber = computeDayNumber(challenge.startDate, todayStr);
    return getEditableDays(todayDayNumber);
  },
});

export const getLifetimeStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return { lifetimeRestartCount: 0, longestStreak: 0, currentStreak: 0, attemptNumber: 1 };
    }

    const lifetimeRestartCount = user.lifetimeRestartCount ?? 0;
    const longestStreak = user.longestStreak ?? 0;
    const attemptNumber = lifetimeRestartCount + 1;

    // Compute current streak from active challenge
    let currentStreak = 0;
    if (user.currentChallengeId) {
      const challenge = await ctx.db.get(user.currentChallengeId);
      if (challenge && challenge.status === "active") {
        // Check if challenge uses the new habit system
        const habitDefs = await ctx.db
          .query("habitDefinitions")
          .withIndex("by_challenge", (q) => q.eq("challengeId", challenge._id))
          .collect();

        if (habitDefs.length > 0) {
          // New system: check habitEntries
          const hardHabits = habitDefs.filter((h) => h.isActive && h.isHard);
          for (let day = 1; day <= challenge.currentDay; day++) {
            const entries = await ctx.db
              .query("habitEntries")
              .withIndex("by_challenge_day", (q) =>
                q.eq("challengeId", challenge._id).eq("dayNumber", day)
              )
              .collect();
            const entryMap = new Map(entries.map((e) => [e.habitDefinitionId, e]));
            const dayComplete = hardHabits.every((h) => {
              const entry = entryMap.get(h._id);
              return entry?.completed;
            });
            if (dayComplete) {
              currentStreak = day;
            } else {
              break;
            }
          }
        } else {
          // Legacy system: check dailyLogs
          const logs = await ctx.db
            .query("dailyLogs")
            .withIndex("by_challenge", (q) => q.eq("challengeId", challenge._id))
            .collect();
          const completedDays = new Set(
            logs.filter((l) => l.allRequirementsMet).map((l) => l.dayNumber)
          );
          for (let day = 1; day <= challenge.currentDay; day++) {
            if (completedDays.has(day)) {
              currentStreak = day;
            } else {
              break;
            }
          }
        }
      }
    }

    return { lifetimeRestartCount, longestStreak, currentStreak, attemptNumber };
  },
});

export const resetAndReOnboard = mutation({
  args: {
    challengeId: v.id("challenges"),
    failedOnDay: v.number(),
  },
  handler: async (ctx, args) => {
    const challenge = await ctx.db.get(args.challengeId);
    if (!challenge) throw new Error("Challenge not found");

    // Fail the current challenge (preserves lifetimeRestartCount, longestStreak, history)
    await failChallengeInternal(ctx, args.challengeId, args.failedOnDay);

    // Set onboardingComplete = false so they're routed back to /onboarding
    // Keep hasSeenTutorial = true so the tutorial auto-skips
    await ctx.db.patch(challenge.userId, {
      onboardingComplete: false,
    });
  },
});

/**
 * Reset progress while keeping the existing habit setup. Fails the current
 * challenge, then starts a fresh one from day 1 with the same visibility,
 * setupTier, and habit definitions copied over. Leaves `onboardingComplete`
 * as true so the user lands directly on the dashboard — no onboarding walk.
 */
export const resetKeepingSetup = mutation({
  args: {
    challengeId: v.id("challenges"),
    failedOnDay: v.number(),
    startDate: v.string(),
  },
  handler: async (ctx, args) => {
    const oldChallenge = await ctx.db.get(args.challengeId);
    if (!oldChallenge) throw new Error("Challenge not found");

    // Snapshot habit definitions before failing (fail doesn't touch them,
    // but doing the read first keeps the data flow linear and obvious).
    const oldHabits = await ctx.db
      .query("habitDefinitions")
      .withIndex("by_challenge", (q) => q.eq("challengeId", args.challengeId))
      .collect();

    await failChallengeInternal(ctx, args.challengeId, args.failedOnDay);

    const newChallengeId = await ctx.db.insert("challenges", {
      userId: oldChallenge.userId,
      startDate: args.startDate,
      currentDay: 1,
      status: "active",
      visibility: oldChallenge.visibility,
      restartCount: 0,
      setupTier: oldChallenge.setupTier,
    });

    for (const h of oldHabits) {
      await ctx.db.insert("habitDefinitions", {
        challengeId: newChallengeId,
        userId: h.userId,
        name: h.name,
        blockType: h.blockType,
        target: h.target,
        unit: h.unit,
        isHard: h.isHard,
        isActive: h.isActive,
        sortOrder: h.sortOrder,
        category: h.category,
        icon: h.icon,
      });
    }

    await ctx.db.patch(oldChallenge.userId, {
      currentChallengeId: newChallengeId,
    });

    await ctx.db.insert("activityFeed", {
      userId: oldChallenge.userId,
      type: "challenge_started",
      challengeId: newChallengeId,
      message: "Started the 75 HARD challenge!",
      createdAt: new Date().toISOString(),
    });

    return newChallengeId;
  },
});

export const updateVisibility = mutation({
  args: {
    challengeId: v.id("challenges"),
    visibility: v.union(
      v.literal("private"),
      v.literal("friends"),
      v.literal("public")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.challengeId, {
      visibility: args.visibility,
    });
  },
});
