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
