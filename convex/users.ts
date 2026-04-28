import { v } from "convex/values";
import { mutation, query, internalQuery } from "./_generated/server";
import { Doc } from "./_generated/dataModel";

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
  },
});

export const getUser = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();
  },
});

export const getUserById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

export const createOrGetUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (existingUser) {
      return existingUser._id;
    }

    // Create new user with default preferences
    const userId = await ctx.db.insert("users", {
      clerkId: identity.subject,
      displayName: identity.name ?? identity.email ?? "User",
      avatarUrl: identity.pictureUrl,
      preferences: {
        timezone: "America/New_York",
        waterUnit: "oz",
        sharing: {
          showStreak: true,
          showDayNumber: true,
          showCompletionStatus: true,
        },
      },
    });

    return userId;
  },
});

export const updateUser = mutation({
  args: {
    displayName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    preferences: v.optional(
      v.object({
        timezone: v.string(),
        reminderTime: v.optional(v.string()),
        waterUnit: v.union(v.literal("oz"), v.literal("ml")),
        sharing: v.optional(v.object({
          showStreak: v.boolean(),
          showDayNumber: v.boolean(),
          showCompletionStatus: v.boolean(),
          showHabits: v.optional(v.boolean()),
        })),
        notifications: v.optional(v.object({
          enabled: v.boolean(),
          morningReminder: v.boolean(),
          eveningReminder: v.boolean(),
          morningTime: v.string(),
          eveningTime: v.string(),
          nudges: v.optional(v.boolean()),
          reactions: v.optional(v.boolean()),
        })),
      })
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const updates: Record<string, unknown> = {};
    if (args.displayName !== undefined) updates.displayName = args.displayName;
    if (args.avatarUrl !== undefined) updates.avatarUrl = args.avatarUrl;
    if (args.preferences !== undefined) updates.preferences = args.preferences;

    await ctx.db.patch(user._id, updates);
  },
});

// PD-8: identity statement set/unset. Trim, cap at 140 chars; pass `null` or
// empty string to clear. Stored on `users.identityStatement`; the Progress
// identity card prefers it over generated formation-stage copy.
export const setIdentityStatement = mutation({
  args: { statement: v.union(v.string(), v.null()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");

    // Truncate (don't throw) — clients can send arbitrary input from the
    // settings UI; throwing on a UTF-8-bloated 140-char paste would surprise
    // the user and the cap is a presentation choice, not a correctness one.
    const trimmed =
      typeof args.statement === "string" ? args.statement.trim() : "";
    const capped = trimmed.slice(0, 140);
    const cleared = args.statement === null || capped.length === 0;

    await ctx.db.patch(user._id, {
      identityStatement: cleared ? undefined : capped,
    });
  },
});

export const setCurrentChallenge = mutation({
  args: {
    challengeId: v.optional(v.id("challenges")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, {
      currentChallengeId: args.challengeId,
    });
  },
});

export const markTutorialSeen = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, { hasSeenTutorial: true });
  },
});

export const resetTutorialSeen = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, { hasSeenTutorial: false });
  },
});

/**
 * Internal: resolve a Clerk user id (e.g. "user_...") to its Convex users doc.
 *
 * Used by dev-only actions like `pushActions:sendTestNotificationToSelf` that
 * accept a Clerk id from the operator so they don't have to look up the
 * opaque Convex `_id` first.
 */
export const getUserByClerkIdInternal = internalQuery({
  args: { clerkId: v.string() },
  handler: async (ctx, args): Promise<Doc<"users"> | null> => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();
  },
});

/**
 * Internal: load a user doc by its Convex `_id`. Used from "use node" actions
 * (which can't touch `ctx.db`) to read the target user's display name and
 * notification preferences before fanning out a push.
 */
export const getUserByIdInternal = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args): Promise<Doc<"users"> | null> => {
    return await ctx.db.get(args.userId);
  },
});
