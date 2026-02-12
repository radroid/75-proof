import { v, ConvexError } from "convex/values";
import { mutation, query, MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import {
  getTodayInTimezone,
  computeDayNumber,
  isDayEditable,
} from "./lib/dayCalculation";

const workoutValidator = v.object({
  type: v.union(
    v.literal("strength"),
    v.literal("cardio"),
    v.literal("yoga"),
    v.literal("sports"),
    v.literal("other")
  ),
  name: v.string(),
  durationMinutes: v.number(),
  isOutdoor: v.boolean(),
  notes: v.optional(v.string()),
  sourceDevice: v.optional(
    v.union(
      v.literal("manual"),
      v.literal("apple_health"),
      v.literal("oura"),
      v.literal("whoop")
    )
  ),
  externalId: v.optional(v.string()),
});

/** Validate that the given day is still within the edit window. Throws ConvexError if not. */
async function validateEditWindow(
  ctx: MutationCtx,
  challengeId: Id<"challenges">,
  dayNumber: number,
  userTimezone: string
) {
  const challenge = await ctx.db.get(challengeId);
  if (!challenge) {
    throw new Error("Challenge not found");
  }

  const todayStr = getTodayInTimezone(userTimezone);
  const todayDayNumber = computeDayNumber(challenge.startDate, todayStr);

  if (!isDayEditable(dayNumber, todayDayNumber)) {
    throw new ConvexError({
      code: "EDIT_WINDOW_CLOSED",
      message: `Day ${dayNumber} is no longer editable. You can only edit days within 2 days of today.`,
    });
  }
}

export const getDailyLog = query({
  args: {
    challengeId: v.id("challenges"),
    dayNumber: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("dailyLogs")
      .withIndex("by_challenge_day", (q) =>
        q.eq("challengeId", args.challengeId).eq("dayNumber", args.dayNumber)
      )
      .unique();
  },
});

export const getDailyLogByDate = query({
  args: {
    userId: v.id("users"),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("dailyLogs")
      .withIndex("by_date", (q) =>
        q.eq("userId", args.userId).eq("date", args.date)
      )
      .unique();
  },
});

export const getChallengeLogs = query({
  args: { challengeId: v.id("challenges") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("dailyLogs")
      .withIndex("by_challenge", (q) => q.eq("challengeId", args.challengeId))
      .collect();
  },
});

export const createOrUpdateDailyLog = mutation({
  args: {
    challengeId: v.id("challenges"),
    userId: v.id("users"),
    dayNumber: v.number(),
    date: v.string(),
    userTimezone: v.optional(v.string()),
    workout1: v.optional(workoutValidator),
    workout2: v.optional(workoutValidator),
    dietFollowed: v.optional(v.boolean()),
    noAlcohol: v.optional(v.boolean()),
    waterIntakeOz: v.optional(v.number()),
    readingMinutes: v.optional(v.number()),
    progressPhotoId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    if (args.userTimezone) {
      await validateEditWindow(ctx, args.challengeId, args.dayNumber, args.userTimezone);
    }

    const existingLog = await ctx.db
      .query("dailyLogs")
      .withIndex("by_challenge_day", (q) =>
        q.eq("challengeId", args.challengeId).eq("dayNumber", args.dayNumber)
      )
      .unique();

    // Calculate if outdoor workout is completed
    const workout1 = args.workout1 ?? existingLog?.workout1;
    const workout2 = args.workout2 ?? existingLog?.workout2;
    const outdoorWorkoutCompleted =
      (workout1?.isOutdoor ?? false) || (workout2?.isOutdoor ?? false);

    // Calculate if all requirements are met
    const dietFollowed = args.dietFollowed ?? existingLog?.dietFollowed ?? false;
    const noAlcohol = args.noAlcohol ?? existingLog?.noAlcohol ?? false;
    const waterIntakeOz = args.waterIntakeOz ?? existingLog?.waterIntakeOz ?? 0;
    const readingMinutes = args.readingMinutes ?? existingLog?.readingMinutes ?? 0;
    const progressPhotoId = args.progressPhotoId ?? existingLog?.progressPhotoId;

    const workout1Complete =
      workout1 !== undefined && workout1.durationMinutes >= 45;
    const workout2Complete =
      workout2 !== undefined && workout2.durationMinutes >= 45;

    const allRequirementsMet =
      workout1Complete &&
      workout2Complete &&
      outdoorWorkoutCompleted &&
      dietFollowed &&
      noAlcohol &&
      waterIntakeOz >= 128 &&
      readingMinutes >= 20 &&
      progressPhotoId !== undefined;

    if (existingLog) {
      // Update existing log
      await ctx.db.patch(existingLog._id, {
        workout1: args.workout1 ?? existingLog.workout1,
        workout2: args.workout2 ?? existingLog.workout2,
        outdoorWorkoutCompleted,
        dietFollowed,
        noAlcohol,
        waterIntakeOz,
        readingMinutes,
        progressPhotoId,
        allRequirementsMet,
        completedAt: allRequirementsMet ? new Date().toISOString() : undefined,
      });

      return existingLog._id;
    } else {
      // Create new log
      const logId = await ctx.db.insert("dailyLogs", {
        challengeId: args.challengeId,
        userId: args.userId,
        dayNumber: args.dayNumber,
        date: args.date,
        workout1: args.workout1,
        workout2: args.workout2,
        outdoorWorkoutCompleted,
        dietFollowed: args.dietFollowed ?? false,
        noAlcohol: args.noAlcohol ?? false,
        waterIntakeOz: args.waterIntakeOz ?? 0,
        readingMinutes: args.readingMinutes ?? 0,
        progressPhotoId: args.progressPhotoId,
        allRequirementsMet,
        completedAt: allRequirementsMet ? new Date().toISOString() : undefined,
      });

      return logId;
    }
  },
});

export const markDayComplete = mutation({
  args: {
    challengeId: v.id("challenges"),
    dayNumber: v.number(),
  },
  handler: async (ctx, args) => {
    const log = await ctx.db
      .query("dailyLogs")
      .withIndex("by_challenge_day", (q) =>
        q.eq("challengeId", args.challengeId).eq("dayNumber", args.dayNumber)
      )
      .unique();

    if (!log) {
      throw new Error("Daily log not found");
    }

    if (!log.allRequirementsMet) {
      throw new Error("Not all requirements are met for this day");
    }

    const challenge = await ctx.db.get(args.challengeId);
    if (!challenge) {
      throw new Error("Challenge not found");
    }

    // Create activity feed entry
    await ctx.db.insert("activityFeed", {
      userId: log.userId,
      type: "day_completed",
      challengeId: args.challengeId,
      dayNumber: args.dayNumber,
      message: `Completed Day ${args.dayNumber} of 75 HARD!`,
      createdAt: new Date().toISOString(),
    });

    return log._id;
  },
});

export const updateWaterIntake = mutation({
  args: {
    challengeId: v.id("challenges"),
    userId: v.id("users"),
    dayNumber: v.number(),
    date: v.string(),
    waterIntakeOz: v.number(),
    userTimezone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.userTimezone) {
      await validateEditWindow(ctx, args.challengeId, args.dayNumber, args.userTimezone);
    }

    const existingLog = await ctx.db
      .query("dailyLogs")
      .withIndex("by_challenge_day", (q) =>
        q.eq("challengeId", args.challengeId).eq("dayNumber", args.dayNumber)
      )
      .unique();

    if (existingLog) {
      await ctx.db.patch(existingLog._id, {
        waterIntakeOz: args.waterIntakeOz,
      });
      return existingLog._id;
    } else {
      return await ctx.db.insert("dailyLogs", {
        challengeId: args.challengeId,
        userId: args.userId,
        dayNumber: args.dayNumber,
        date: args.date,
        waterIntakeOz: args.waterIntakeOz,
        outdoorWorkoutCompleted: false,
        dietFollowed: false,
        noAlcohol: false,
        readingMinutes: 0,
        allRequirementsMet: false,
      });
    }
  },
});

export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

export const getProgressPhotoUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

export const getProgressPhotos = query({
  args: { challengeId: v.id("challenges") },
  handler: async (ctx, args) => {
    const logs = await ctx.db
      .query("dailyLogs")
      .withIndex("by_challenge", (q) => q.eq("challengeId", args.challengeId))
      .collect();

    const photosWithUrls = [];
    for (const log of logs) {
      if (log.progressPhotoId) {
        const url = await ctx.storage.getUrl(log.progressPhotoId);
        if (url) {
          photosWithUrls.push({
            dayNumber: log.dayNumber,
            date: log.date,
            url,
            storageId: log.progressPhotoId,
          });
        }
      }
    }
    return photosWithUrls.sort((a, b) => b.dayNumber - a.dayNumber);
  },
});

export const clearWorkout = mutation({
  args: {
    challengeId: v.id("challenges"),
    dayNumber: v.number(),
    workoutNumber: v.union(v.literal(1), v.literal(2)),
    userTimezone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.userTimezone) {
      await validateEditWindow(ctx, args.challengeId, args.dayNumber, args.userTimezone);
    }

    const existingLog = await ctx.db
      .query("dailyLogs")
      .withIndex("by_challenge_day", (q) =>
        q.eq("challengeId", args.challengeId).eq("dayNumber", args.dayNumber)
      )
      .unique();

    if (!existingLog) return;

    const workout1 = args.workoutNumber === 1 ? undefined : existingLog.workout1;
    const workout2 = args.workoutNumber === 2 ? undefined : existingLog.workout2;
    const outdoorWorkoutCompleted =
      (workout1?.isOutdoor ?? false) || (workout2?.isOutdoor ?? false);

    await ctx.db.patch(existingLog._id, {
      ...(args.workoutNumber === 1 ? { workout1: undefined } : { workout2: undefined }),
      outdoorWorkoutCompleted,
      allRequirementsMet: false,
      completedAt: undefined,
    });

    return existingLog._id;
  },
});

export const quickLogWorkout = mutation({
  args: {
    challengeId: v.id("challenges"),
    userId: v.id("users"),
    dayNumber: v.number(),
    date: v.string(),
    workoutNumber: v.union(v.literal(1), v.literal(2)),
    userTimezone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.userTimezone) {
      await validateEditWindow(ctx, args.challengeId, args.dayNumber, args.userTimezone);
    }

    const existingLog = await ctx.db
      .query("dailyLogs")
      .withIndex("by_challenge_day", (q) =>
        q.eq("challengeId", args.challengeId).eq("dayNumber", args.dayNumber)
      )
      .unique();

    const workoutData = {
      type: "other" as const,
      name: args.workoutNumber === 2 ? "Outdoor Workout" : "Workout",
      durationMinutes: 45,
      isOutdoor: args.workoutNumber === 2,
    };

    const workoutField = args.workoutNumber === 1 ? "workout1" : "workout2";

    if (existingLog) {
      // Don't overwrite if workout already logged
      if (existingLog[workoutField]) {
        return existingLog._id;
      }

      const workout1 = workoutField === "workout1" ? workoutData : existingLog.workout1;
      const workout2 = workoutField === "workout2" ? workoutData : existingLog.workout2;
      const outdoorWorkoutCompleted =
        (workout1?.isOutdoor ?? false) || (workout2?.isOutdoor ?? false);

      const workout1Complete = workout1 !== undefined && workout1.durationMinutes >= 45;
      const workout2Complete = workout2 !== undefined && workout2.durationMinutes >= 45;

      const allRequirementsMet =
        workout1Complete &&
        workout2Complete &&
        outdoorWorkoutCompleted &&
        existingLog.dietFollowed &&
        existingLog.noAlcohol &&
        existingLog.waterIntakeOz >= 128 &&
        existingLog.readingMinutes >= 20 &&
        existingLog.progressPhotoId !== undefined;

      await ctx.db.patch(existingLog._id, {
        [workoutField]: workoutData,
        outdoorWorkoutCompleted,
        allRequirementsMet,
        completedAt: allRequirementsMet ? new Date().toISOString() : undefined,
      });
      return existingLog._id;
    } else {
      return await ctx.db.insert("dailyLogs", {
        challengeId: args.challengeId,
        userId: args.userId,
        dayNumber: args.dayNumber,
        date: args.date,
        [workoutField]: workoutData,
        outdoorWorkoutCompleted: workoutData.isOutdoor,
        dietFollowed: false,
        noAlcohol: false,
        waterIntakeOz: 0,
        readingMinutes: 0,
        allRequirementsMet: false,
      });
    }
  },
});
