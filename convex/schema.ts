import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // User Profile (extends Clerk user)
  users: defineTable({
    clerkId: v.string(),
    displayName: v.string(),
    avatarUrl: v.optional(v.string()),
    currentChallengeId: v.optional(v.id("challenges")),
    preferences: v.object({
      timezone: v.string(),
      reminderTime: v.optional(v.string()),
      waterUnit: v.union(v.literal("oz"), v.literal("ml")),
      sharing: v.optional(v.object({
        showStreak: v.boolean(),
        showDayNumber: v.boolean(),
        showCompletionStatus: v.boolean(),
      })),
    }),
  })
    .index("by_clerk_id", ["clerkId"]),

  // Challenge Instance (one per 75-day attempt)
  challenges: defineTable({
    userId: v.id("users"),
    startDate: v.string(), // ISO date
    currentDay: v.number(), // 1-75
    status: v.union(
      v.literal("active"),
      v.literal("completed"),
      v.literal("failed")
    ),
    failedOnDay: v.optional(v.number()),
    visibility: v.union(
      v.literal("private"),
      v.literal("friends"),
      v.literal("public")
    ),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),

  // Daily Log (one per day per challenge)
  dailyLogs: defineTable({
    challengeId: v.id("challenges"),
    userId: v.id("users"),
    dayNumber: v.number(),
    date: v.string(), // ISO date

    // 75 HARD Requirements
    workout1: v.optional(
      v.object({
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
      })
    ),
    workout2: v.optional(
      v.object({
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
      })
    ),
    outdoorWorkoutCompleted: v.boolean(),
    dietFollowed: v.boolean(),
    noAlcohol: v.boolean(),
    waterIntakeOz: v.number(), // in oz (goal: 128oz / 1 gallon)
    readingMinutes: v.number(), // goal: 10 pages ~= 20 min
    progressPhotoId: v.optional(v.id("_storage")),

    // Computed
    allRequirementsMet: v.boolean(),
    completedAt: v.optional(v.string()), // ISO timestamp
  })
    .index("by_challenge", ["challengeId"])
    .index("by_user", ["userId"])
    .index("by_challenge_day", ["challengeId", "dayNumber"])
    .index("by_date", ["userId", "date"]),

  // Friend relationships
  friendships: defineTable({
    userId: v.id("users"),
    friendId: v.id("users"),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("declined")
    ),
    createdAt: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_friend", ["friendId"])
    .index("by_user_status", ["userId", "status"]),

  // Activity Feed Item
  activityFeed: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("day_completed"),
      v.literal("challenge_started"),
      v.literal("challenge_completed"),
      v.literal("challenge_failed"),
      v.literal("milestone")
    ),
    challengeId: v.id("challenges"),
    dayNumber: v.optional(v.number()),
    message: v.string(),
    createdAt: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_created", ["createdAt"]),

  // Connected health devices
  connectedDevices: defineTable({
    userId: v.id("users"),
    provider: v.union(
      v.literal("apple_health"),
      v.literal("oura"),
      v.literal("whoop")
    ),
    accessToken: v.optional(v.string()),
    refreshToken: v.optional(v.string()),
    expiresAt: v.optional(v.string()),
    lastSyncAt: v.optional(v.string()),
    isActive: v.boolean(),
  })
    .index("by_user", ["userId"])
    .index("by_user_provider", ["userId", "provider"]),
});
