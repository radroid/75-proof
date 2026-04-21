"use node";

import { v } from "convex/values";
import webpush from "web-push";
import { ActionCtx, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";

/**
 * Initialize web-push with the VAPID keys from the Convex environment.
 *
 * Required env vars (set in the Convex dashboard — *not* in `.env.local` for
 * production):
 *   - VAPID_PUBLIC_KEY
 *   - VAPID_PRIVATE_KEY
 *   - VAPID_SUBJECT (e.g. "mailto:you@example.com")
 *
 * Call this once per action invocation. web-push caches the VAPID details
 * on its module singleton, so re-calling is cheap and idempotent.
 */
function ensureVapidConfigured(): boolean {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@75proof.app";
  if (!publicKey || !privateKey) {
    // eslint-disable-next-line no-console
    console.warn(
      "[push] VAPID keys missing — set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in the Convex dashboard"
    );
    return false;
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  return true;
}

/**
 * The payload our service worker expects. Fields map directly onto
 * `ServiceWorkerRegistration.showNotification()` options, plus `title`.
 *
 * Platform-specific fields (actions/vibrate/badge) are OPTIONAL so iOS
 * payloads can omit them without the SW choking — the SW treats all of
 * these as best-effort.
 */
export type PushAction = {
  action: string;
  title: string;
  icon?: string;
};

export type PushPayload = {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
  actions?: PushAction[];
  vibrate?: number[];
  requireInteraction?: boolean;
};

type Platform = "ios" | "android" | "desktop";
type Slot = "morning" | "evening";

/**
 * Format today's local date as YYYY-MM-DD for use in notification tags.
 * We use UTC here (not the user's TZ) because tags only need to be stable
 * *within* a given push burst — the dispatcher already gates once-per-day
 * delivery using the user's local clock.
 */
function todayTagSuffix(): string {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Baseline copy for a reminder slot — platform-agnostic text that every
 * variant reuses. Keeping copy in one place ensures Android/iOS/Desktop
 * notifications all read identically on the user's devices.
 */
function reminderCopy(slot: Slot): {
  title: string;
  body: string;
  openActionLabel: string;
  dismissActionLabel: string;
} {
  if (slot === "morning") {
    return {
      title: "Good morning — time to start",
      body: "Your 75 HARD day begins now.",
      openActionLabel: "Start checklist",
      dismissActionLabel: "Not now",
    };
  }
  return {
    title: "Evening check-in",
    body: "Finish today strong — tap to log what's left.",
    openActionLabel: "Mark complete",
    dismissActionLabel: "Later",
  };
}

/**
 * Build a platform-specific reminder payload.
 *
 * Per-platform notes:
 *   - Android: full treatment — actions, badge, vibrate, tag w/ date.
 *   - iOS (installed PWA, Safari 16.4+): strict subset. No actions, no
 *     vibrate, no badge — iOS may throttle apps whose payloads misbehave.
 *   - Desktop: same shape as Android. Clients can negotiate further based
 *     on `Notification.maxActions` on the SW side (we always send actions;
 *     the SW / browser drops them if unsupported).
 *
 * NOTE: `icon-badge.png` does not yet exist in /public. We fall back to
 * `/icon-192.png` which Android will auto-grayscale into the status-bar
 * badge. Follow-up: ship a proper 72x72 monochrome badge asset.
 */
export function buildReminderPayload(
  slot: Slot,
  platform: Platform
): PushPayload {
  const copy = reminderCopy(slot);
  const tag = `75proof-${slot}-${todayTagSuffix()}`;
  const data = { url: "/dashboard", slot };

  if (platform === "ios") {
    // iOS PWA: keep it minimal. Actions/vibrate/badge are ignored (and
    // over-rich payloads can get an app throttled by APNs).
    return {
      title: copy.title,
      body: copy.body,
      icon: "/icon-192.png",
      tag,
      data,
    };
  }

  // Android + Desktop share the rich payload. The service worker is the
  // single decision point for how to render — if a browser doesn't support
  // actions, it'll just drop them.
  return {
    title: copy.title,
    body: copy.body,
    icon: "/icon-192.png",
    // TODO: replace with a dedicated /icon-badge.png (72x72 monochrome).
    badge: "/icon-192.png",
    vibrate: [200, 100, 200],
    tag,
    data,
    requireInteraction: false,
    actions: [
      { action: "open", title: copy.openActionLabel },
      { action: "dismiss", title: copy.dismissActionLabel },
    ],
  };
}

/**
 * Send a test push to all of a user's registered subscriptions. Invalid
 * subscriptions (HTTP 404/410) are surfaced in the result so a follow-up
 * mutation can prune them — we don't mutate the DB directly here since
 * actions can't hit `ctx.db` (see Convex guidelines).
 *
 * Now builds a per-platform payload per subscription row (same as the
 * scheduled reminder path), so "send me a test" mirrors what a real
 * reminder looks like on this device.
 */
export const sendTestPush = internalAction({
  args: {
    userId: v.id("users"),
    title: v.optional(v.string()),
    body: v.optional(v.string()),
    slot: v.optional(v.union(v.literal("morning"), v.literal("evening"))),
  },
  handler: async (
    ctx,
    args
  ): Promise<{
    sent: number;
    failed: number;
    goneEndpoints: string[];
  }> => {
    if (!ensureVapidConfigured()) {
      return { sent: 0, failed: 0, goneEndpoints: [] };
    }

    const subs: Doc<"pushSubscriptions">[] = await ctx.runQuery(
      internal.pushSubscriptions.listSubscriptionsForUser,
      { userId: args.userId as Id<"users"> }
    );

    const slot: Slot = args.slot ?? "morning";

    let sent = 0;
    let failed = 0;
    const goneEndpoints: string[] = [];

    for (const sub of subs) {
      if (!sub.enabled) continue;
      // Build a payload tailored to *this* subscription's platform.
      const payload = buildReminderPayload(slot, sub.platform);
      // Caller overrides (mainly useful for smoke tests from the dashboard).
      if (args.title) payload.title = args.title;
      if (args.body) payload.body = args.body;

      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: sub.keys,
          },
          JSON.stringify(payload),
          { TTL: 60 }
        );
        sent++;
      } catch (err: unknown) {
        failed++;
        const statusCode =
          err && typeof err === "object" && "statusCode" in err
            ? (err as { statusCode?: number }).statusCode
            : undefined;
        // 404 / 410 = the push service says this subscription is permanently
        // gone; callers should prune.
        if (statusCode === 404 || statusCode === 410) {
          goneEndpoints.push(sub.endpoint);
        } else {
          // eslint-disable-next-line no-console
          console.warn("[push] send failed", statusCode, err);
        }
      }
    }

    return { sent, failed, goneEndpoints };
  },
});

/**
 * Send the morning/evening reminder push to every active subscription of the
 * given user. Dead endpoints (404/410 from the push service) are collected
 * and pruned via an internal mutation.
 *
 * Invariant: by the time this action runs, `notificationDeliveries` already
 * has a row for (user, slot, localDate) — the dispatcher inserts it before
 * scheduling us. If VAPID is misconfigured or all subs are gone, we just
 * no-op; we don't roll back the delivery row (the user's preferences clearly
 * say they want reminders, and we did our best).
 *
 * Each subscription row carries its `platform`, so we build a distinct
 * payload per device — the iOS PWA on the user's phone gets the minimal
 * variant while Android/Chrome get the full action-button treatment.
 */
export const sendReminderPush = internalAction({
  args: {
    userId: v.id("users"),
    slot: v.union(v.literal("morning"), v.literal("evening")),
  },
  handler: async (
    ctx,
    args
  ): Promise<{ sent: number; failed: number; pruned: number }> => {
    if (!ensureVapidConfigured()) {
      return { sent: 0, failed: 0, pruned: 0 };
    }

    const subs: Doc<"pushSubscriptions">[] = await ctx.runQuery(
      internal.pushSubscriptions.listSubscriptionsForUser,
      { userId: args.userId as Id<"users"> }
    );
    if (subs.length === 0) {
      return { sent: 0, failed: 0, pruned: 0 };
    }

    let sent = 0;
    let failed = 0;
    const goneEndpoints: string[] = [];

    for (const sub of subs) {
      if (!sub.enabled) continue;
      const payload = buildReminderPayload(args.slot, sub.platform);
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          JSON.stringify(payload),
          { TTL: 60 }
        );
        sent++;
      } catch (err: unknown) {
        failed++;
        const statusCode =
          err && typeof err === "object" && "statusCode" in err
            ? (err as { statusCode?: number }).statusCode
            : undefined;
        if (statusCode === 404 || statusCode === 410) {
          goneEndpoints.push(sub.endpoint);
        } else {
          // eslint-disable-next-line no-console
          console.warn("[push] reminder send failed", statusCode, err);
        }
      }
    }

    let pruned = 0;
    if (goneEndpoints.length > 0) {
      pruned = await ctx.runMutation(
        internal.pushSubscriptions.pruneDeadSubscriptions,
        { endpoints: goneEndpoints }
      );
    }

    return { sent, failed, pruned };
  },
});

/**
 * Dev-only shortcut: run the same dispatcher the cron runs, immediately.
 * Internal, so the only way to invoke it is via `npx convex run
 * reminders:dispatchDueReminders` or this alias from a trusted caller.
 *
 * Intentionally NOT exposed as `action` — we never want the public API to
 * have a "send reminders" endpoint.
 */
export const runDueRemindersNow = internalAction({
  args: {},
  handler: async (ctx): Promise<{ scheduled: number; skipped: number }> => {
    return await ctx.runAction(internal.reminders.dispatchDueReminders, {});
  },
});

/**
 * Dev-only: send a properly-formatted per-platform reminder payload to every
 * active subscription of the given user, bypassing the dispatcher and the
 * per-day delivery gate. Useful for "what does this look like on my phone"
 * smoke tests from the Convex dashboard (`convex run`).
 *
 * This does NOT write to `notificationDeliveries`, so it won't interfere
 * with the real once-per-day reminder gating.
 *
 * Accepts any one of `userId` (Convex `_id`) or `clerkId` (the Clerk user id
 * you see in your auth provider, e.g. "user_..."). `email` is not supported
 * because the `users` table doesn't store an indexed email column.
 *
 * Examples:
 *   npx convex run pushActions:sendTestNotificationToSelf \
 *     '{"userId":"<Convex users _id>","slot":"morning"}'
 *   npx convex run pushActions:sendTestNotificationToSelf \
 *     '{"clerkId":"user_3A7qlaPsR6jolcubb8os5I3tHlR","slot":"evening"}'
 */
export const sendTestNotificationToSelf = internalAction({
  args: {
    userId: v.optional(v.id("users")),
    clerkId: v.optional(v.string()),
    email: v.optional(v.string()),
    slot: v.union(v.literal("morning"), v.literal("evening")),
  },
  handler: async (
    ctx,
    args
  ): Promise<{ sent: number; failed: number; pruned: number }> => {
    const resolvedId = await resolveUserId(ctx, args);
    return await ctx.runAction(internal.pushActions.sendReminderPush, {
      userId: resolvedId,
      slot: args.slot,
    });
  },
});

/**
 * Convenience wrapper: "send my reminder now" from the Convex dashboard.
 *
 * `npx convex run pushActions:runMyReminderNow '{"clerkId":"user_..."}'`
 *
 * Defaults to the morning slot so you don't have to remember the union.
 */
export const runMyReminderNow = internalAction({
  args: {
    clerkId: v.string(),
    slot: v.optional(v.union(v.literal("morning"), v.literal("evening"))),
  },
  handler: async (
    ctx,
    args
  ): Promise<{ sent: number; failed: number; pruned: number }> => {
    const resolvedId = await resolveUserId(ctx, { clerkId: args.clerkId });
    return await ctx.runAction(internal.pushActions.sendReminderPush, {
      userId: resolvedId,
      slot: args.slot ?? "morning",
    });
  },
});

type ResolveArgs = {
  userId?: Id<"users">;
  clerkId?: string;
  email?: string;
};

/**
 * Resolve an `Id<"users">` from whichever lookup key the caller provided.
 * Throws with a clear message if none were supplied or the user can't be
 * found. Email is rejected explicitly (not indexed in the schema).
 */
async function resolveUserId(
  ctx: ActionCtx,
  args: ResolveArgs
): Promise<Id<"users">> {
  if (args.userId) return args.userId;

  if (args.clerkId) {
    const user: Doc<"users"> | null = await ctx.runQuery(
      internal.users.getUserByClerkIdInternal,
      { clerkId: args.clerkId }
    );
    if (!user) {
      throw new Error(
        `No user found with clerkId "${args.clerkId}". Pass a valid Clerk user id.`
      );
    }
    return user._id;
  }

  if (args.email) {
    throw new Error(
      "email lookup is not supported — the users table has no email index. Pass userId or clerkId instead."
    );
  }

  throw new Error(
    "sendTestNotificationToSelf requires one of: userId, clerkId. None were provided."
  );
}
