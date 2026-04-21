"use node";

import { v } from "convex/values";
import webpush from "web-push";
import { internalAction } from "./_generated/server";
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

export type PushPayload = {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
};

/**
 * Send a test push to all of a user's registered subscriptions. Invalid
 * subscriptions (HTTP 404/410) are surfaced in the result so a follow-up
 * mutation can prune them — we don't mutate the DB directly here since
 * actions can't hit `ctx.db` (see Convex guidelines).
 *
 * This is a bare-bones foundation for iter E's scheduled reminders.
 */
export const sendTestPush = internalAction({
  args: {
    userId: v.id("users"),
    title: v.optional(v.string()),
    body: v.optional(v.string()),
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

    const payload: PushPayload = {
      title: args.title || "75 Proof",
      body: args.body || "Time to log today's progress.",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: "75proof-test",
      data: { url: "/dashboard" },
    };
    const body = JSON.stringify(payload);

    let sent = 0;
    let failed = 0;
    const goneEndpoints: string[] = [];

    for (const sub of subs) {
      if (!sub.enabled) continue;
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: sub.keys,
          },
          body,
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
 * Payload builder for a reminder slot. Kept as a pure function so the test
 * endpoint and the cron both produce identical copy.
 */
function buildReminderPayload(slot: "morning" | "evening"): PushPayload {
  if (slot === "morning") {
    return {
      title: "Good morning — time to start",
      body: "Your 75 HARD day begins now. Tap to open today's checklist.",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: "75proof-morning",
      data: { url: "/dashboard" },
    };
  }
  return {
    title: "Evening check-in",
    body: "Don't let today slip. Finish strong.",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: "75proof-evening",
    data: { url: "/dashboard" },
  };
}

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

    const payload = buildReminderPayload(args.slot);
    const body = JSON.stringify(payload);

    let sent = 0;
    let failed = 0;
    const goneEndpoints: string[] = [];

    for (const sub of subs) {
      if (!sub.enabled) continue;
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          body,
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
