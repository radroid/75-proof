import { v } from "convex/values";
import {
  mutation,
  query,
  internalQuery,
} from "./_generated/server";
import { getAuthenticatedUser } from "./lib/auth";
import { Doc, Id } from "./_generated/dataModel";

/**
 * Upsert a push subscription for the authenticated user.
 *
 * Browsers key subscriptions by `endpoint` (a stable URL the push service
 * issues). We look up by endpoint so repeated `subscribe()` calls in the
 * same browser don't create duplicate rows — instead we refresh keys and
 * `lastSeenAt`. Ownership is enforced: if an endpoint already exists under
 * a different user, we reject (protects against stale subscription hijack).
 */
export const upsertSubscription = mutation({
  args: {
    endpoint: v.string(),
    keys: v.object({ auth: v.string(), p256dh: v.string() }),
    userAgent: v.optional(v.string()),
    platform: v.union(
      v.literal("ios"),
      v.literal("android"),
      v.literal("desktop")
    ),
    enabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const now = Date.now();

    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .unique();

    if (existing) {
      if (existing.userId !== user._id) {
        throw new Error("Subscription endpoint already registered to another user");
      }
      await ctx.db.patch(existing._id, {
        keys: args.keys,
        userAgent: args.userAgent,
        platform: args.platform,
        enabled: args.enabled,
        lastSeenAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("pushSubscriptions", {
      userId: user._id,
      endpoint: args.endpoint,
      keys: args.keys,
      userAgent: args.userAgent,
      platform: args.platform,
      enabled: args.enabled,
      createdAt: now,
      lastSeenAt: now,
    });
  },
});

/**
 * Remove a push subscription by endpoint. Only the owning user can delete.
 */
export const removeSubscription = mutation({
  args: { endpoint: v.string() },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .unique();
    if (!existing) return null;
    if (existing.userId !== user._id) {
      throw new Error("Not authorized to remove this subscription");
    }
    await ctx.db.delete(existing._id);
    return null;
  },
});

/**
 * Return all push subscriptions for the current user. Bounded by `.take()`
 * for safety — realistically a user has a handful of devices.
 */
export const listMySubscriptions = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) return [];
    return await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .take(50);
  },
});

/**
 * Update the authenticated user's notification preferences. Merges into
 * the existing `preferences` object so we don't clobber other settings.
 */
export const setNotificationPreferences = mutation({
  args: {
    enabled: v.boolean(),
    morningReminder: v.boolean(),
    eveningReminder: v.boolean(),
    morningTime: v.string(),
    eveningTime: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    await ctx.db.patch(user._id, {
      preferences: {
        ...user.preferences,
        notifications: {
          enabled: args.enabled,
          morningReminder: args.morningReminder,
          eveningReminder: args.eveningReminder,
          morningTime: args.morningTime,
          eveningTime: args.eveningTime,
        },
      },
    });
    return null;
  },
});

/**
 * Internal query used by the future cron/action to fan out reminders.
 * Not exposed to the client.
 */
export const listSubscriptionsForUser = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args): Promise<Doc<"pushSubscriptions">[]> => {
    return await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .take(50);
  },
});

/**
 * Internal helper: delete a subscription by id (e.g. after web-push reports
 * a permanent 410/404 on the endpoint). Used by the cron action in iter E.
 */
export const deleteSubscriptionInternal = internalQuery({
  args: { subscriptionId: v.id("pushSubscriptions") },
  handler: async (ctx, args): Promise<Id<"pushSubscriptions"> | null> => {
    const sub = await ctx.db.get(args.subscriptionId);
    return sub ? sub._id : null;
  },
});
