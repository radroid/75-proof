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
      body: "Your day begins now — let's get those habits in.",
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
 * Truncate display names that land in notification titles. Push services
 * (APNs especially) will silently truncate extremely long titles; clamping
 * here keeps the body text visible and prevents layout surprises.
 */
function clampName(name: string, max = 24): string {
  const trimmed = name.trim();
  if (trimmed.length === 0) return "A friend";
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed;
}

/**
 * Nudge push — a friend just pinged you. Short, punchy, one action.
 *
 * The `tag` includes the sender's id so repeat nudges from the *same*
 * friend coalesce into one banner on the device, while a nudge from a
 * *different* friend gets its own entry.
 */
export function buildNudgePayload(
  fromName: string,
  fromUserId: string,
  platform: Platform
): PushPayload {
  const name = clampName(fromName);
  const title = `${name} nudged you 👊`;
  const body = "They're cheering you on — finish today strong.";
  const tag = `nudge-${fromUserId}`;
  // Friends merge Phase 3: nudges deep-link into Progress now. Old pushes
  // pointing at `/dashboard/friends` still work via the redirect file.
  const data = { url: "/dashboard/progress", kind: "nudge", fromUserId };

  if (platform === "ios") {
    return { title, body, icon: "/icon-192.png", tag, data };
  }
  return {
    title,
    body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    vibrate: [60, 40, 60],
    tag,
    data,
    requireInteraction: false,
    actions: [
      { action: "open", title: "Open" },
      { action: "dismiss", title: "Later" },
    ],
  };
}

/**
 * Reaction push — a friend reacted to one of your activity items. Lighter
 * treatment than a nudge: no action buttons, gentler vibrate pattern,
 * single tap to open.
 *
 * `activityLabel` is a short human-readable hint like "on your Day 42"
 * or "on your challenge completion" so the user knows *what* was reacted
 * to without needing to open the app.
 */
export function buildReactionPayload(
  fromName: string,
  fromUserId: string,
  emoji: string,
  activityLabel: string,
  platform: Platform
): PushPayload {
  const name = clampName(fromName);
  const title = `${name} reacted ${emoji}`;
  const body = activityLabel;
  // Coalesce repeat reactions from the same sender into one banner — they
  // may toggle through several emojis, we don't want N buzzes.
  const tag = `reaction-${fromUserId}`;
  const data = { url: "/dashboard/friends", kind: "reaction", fromUserId };

  if (platform === "ios") {
    return { title, body, icon: "/icon-192.png", tag, data };
  }
  return {
    title,
    body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    vibrate: [30, 40, 30],
    tag,
    data,
    requireInteraction: false,
  };
}

/**
 * Generic fan-out. Every push-sending action in this file routes through
 * this one helper so dead-endpoint pruning, per-platform payload
 * construction, and VAPID config checks live in exactly one place.
 *
 * `buildPayload` is called once per subscription so each platform can get
 * a tailored payload (iOS minimal, Android/desktop rich).
 */
async function fanOutPush(
  ctx: ActionCtx,
  userId: Id<"users">,
  buildPayload: (platform: Platform) => PushPayload
): Promise<{ sent: number; failed: number; pruned: number }> {
  if (!ensureVapidConfigured()) {
    return { sent: 0, failed: 0, pruned: 0 };
  }
  const subs: Doc<"pushSubscriptions">[] = await ctx.runQuery(
    internal.pushSubscriptions.listSubscriptionsForUser,
    { userId }
  );
  if (subs.length === 0) return { sent: 0, failed: 0, pruned: 0 };

  // Parallel dispatch — sends are independent network calls, ~100ms each.
  // Users with multiple devices get a proportional latency drop (5 devices:
  // ~500ms serial → ~100ms parallel). Promise.allSettled ensures one
  // failed endpoint can't short-circuit the others.
  const results = await Promise.allSettled(
    subs
      .filter((sub) => sub.enabled)
      .map((sub) =>
        webpush
          .sendNotification(
            { endpoint: sub.endpoint, keys: sub.keys },
            JSON.stringify(buildPayload(sub.platform)),
            { TTL: 60 }
          )
          .then(() => ({ ok: true as const, endpoint: sub.endpoint }))
          .catch((err: unknown) => ({
            ok: false as const,
            endpoint: sub.endpoint,
            statusCode:
              err && typeof err === "object" && "statusCode" in err
                ? (err as { statusCode?: number }).statusCode
                : undefined,
            err,
          }))
      )
  );

  let sent = 0;
  let failed = 0;
  const goneEndpoints: string[] = [];

  for (const r of results) {
    // Inner promise always resolves (catch handler above), so `rejected`
    // should be impossible — guard it anyway and count as failure.
    if (r.status === "rejected") {
      failed++;
      continue;
    }
    if (r.value.ok) {
      sent++;
      continue;
    }
    failed++;
    // 404 / 410 = the push service says this subscription is permanently
    // gone; queue for pruning below.
    if (r.value.statusCode === 404 || r.value.statusCode === 410) {
      goneEndpoints.push(r.value.endpoint);
    } else {
      // eslint-disable-next-line no-console
      console.warn("[push] send failed", r.value.statusCode, r.value.err);
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
}

/**
 * Send the morning/evening reminder push to every active subscription of the
 * given user. Dead endpoints (404/410 from the push service) are pruned
 * via `fanOutPush`'s shared path.
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
    return await fanOutPush(ctx, args.userId, (platform) =>
      buildReminderPayload(args.slot, platform)
    );
  },
});

/**
 * Send a nudge notification to `toUserId` on behalf of `fromUserId`.
 *
 * Loads the recipient's notification preferences and bails silently if
 * they've opted out of nudge notifications. We fetch the sender's display
 * name here (not in the mutation) so a single Node action boundary handles
 * both the lookup and the fan-out.
 */
export const sendNudgePush = internalAction({
  args: {
    toUserId: v.id("users"),
    fromUserId: v.id("users"),
  },
  handler: async (
    ctx,
    args
  ): Promise<{ sent: number; failed: number; pruned: number }> => {
    const [toUser, fromUser] = await Promise.all([
      ctx.runQuery(internal.users.getUserByIdInternal, {
        userId: args.toUserId,
      }),
      ctx.runQuery(internal.users.getUserByIdInternal, {
        userId: args.fromUserId,
      }),
    ]);
    if (!toUser || !fromUser) return { sent: 0, failed: 0, pruned: 0 };

    // Respect the recipient's social-notif preference. Default: enabled
    // (undefined === true) since older users predate the toggle.
    const prefs = toUser.preferences?.notifications;
    if (prefs && prefs.enabled === false) {
      return { sent: 0, failed: 0, pruned: 0 };
    }
    if (prefs && prefs.nudges === false) {
      return { sent: 0, failed: 0, pruned: 0 };
    }

    return await fanOutPush(ctx, args.toUserId, (platform) =>
      buildNudgePayload(fromUser.displayName, args.fromUserId, platform)
    );
  },
});

/**
 * Send a reaction notification to `toUserId` (the activity author) on
 * behalf of `fromUserId` (the reactor).
 *
 * Same opt-out gate as nudges. `activityLabel` is pre-computed by the
 * mutation caller since the activity context (day number, type) lives in
 * the DB and this action doesn't need to refetch it — cheaper than another
 * round-trip.
 */
export const sendReactionPush = internalAction({
  args: {
    toUserId: v.id("users"),
    fromUserId: v.id("users"),
    emoji: v.string(),
    activityLabel: v.string(),
  },
  handler: async (
    ctx,
    args
  ): Promise<{ sent: number; failed: number; pruned: number }> => {
    const [toUser, fromUser] = await Promise.all([
      ctx.runQuery(internal.users.getUserByIdInternal, {
        userId: args.toUserId,
      }),
      ctx.runQuery(internal.users.getUserByIdInternal, {
        userId: args.fromUserId,
      }),
    ]);
    if (!toUser || !fromUser) return { sent: 0, failed: 0, pruned: 0 };

    const prefs = toUser.preferences?.notifications;
    if (prefs && prefs.enabled === false) {
      return { sent: 0, failed: 0, pruned: 0 };
    }
    if (prefs && prefs.reactions === false) {
      return { sent: 0, failed: 0, pruned: 0 };
    }

    return await fanOutPush(ctx, args.toUserId, (platform) =>
      buildReactionPayload(
        fromUser.displayName,
        args.fromUserId,
        args.emoji,
        args.activityLabel,
        platform
      )
    );
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
    userId: v.optional(v.string()),
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

/**
 * Diagnostic: report what we know about a user's push state from the CLI.
 *
 *   npx convex run pushActions:checkMyPushState \
 *     '{"userId":"user_3A7qlaPsR6..."}'
 *
 * Returns vapidConfigured, subscriptionCount, and a short per-sub summary so
 * you can tell whether the problem is (a) no subscription was ever written,
 * (b) VAPID env vars aren't set, or (c) something else.
 */
export const checkMyPushState = internalAction({
  args: {
    userId: v.optional(v.string()),
    clerkId: v.optional(v.string()),
  },
  handler: async (
    ctx,
    args
  ): Promise<{
    userId: Id<"users">;
    vapidConfigured: boolean;
    subscriptionCount: number;
    subscriptions: Array<{
      platform: Platform;
      enabled: boolean;
      lastSeenAt: number;
      endpointHost: string;
    }>;
  }> => {
    const resolvedId = await resolveUserId(ctx, args);
    const vapidConfigured = Boolean(
      process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY
    );
    const subs = await ctx.runQuery(
      internal.pushSubscriptions.listSubscriptionsForUser,
      { userId: resolvedId }
    );
    return {
      userId: resolvedId,
      vapidConfigured,
      subscriptionCount: subs.length,
      subscriptions: subs.map((s: Doc<"pushSubscriptions">) => ({
        platform: s.platform,
        enabled: s.enabled,
        lastSeenAt: s.lastSeenAt,
        endpointHost: (() => {
          try {
            return new URL(s.endpoint).host;
          } catch {
            return "(invalid)";
          }
        })(),
      })),
    };
  },
});

type ResolveArgs = {
  userId?: string;
  clerkId?: string;
  email?: string;
};

/**
 * Resolve an `Id<"users">` from whichever lookup key the caller provided.
 *
 * Accepts both a Convex `_id` and a Clerk user id in the `userId` field —
 * Clerk ids are recognized by the `user_` prefix and routed through the
 * by-clerk lookup. This mirrors what users naturally paste from the Clerk
 * dashboard without making them remember which field to use.
 */
async function resolveUserId(
  ctx: ActionCtx,
  args: ResolveArgs
): Promise<Id<"users">> {
  const lookupByClerk = async (clerkId: string): Promise<Id<"users">> => {
    const user: Doc<"users"> | null = await ctx.runQuery(
      internal.users.getUserByClerkIdInternal,
      { clerkId }
    );
    if (!user) {
      throw new Error(
        `No user found with clerkId "${clerkId}". Pass a valid Clerk user id.`
      );
    }
    return user._id;
  };

  if (args.userId) {
    if (args.userId.startsWith("user_")) return lookupByClerk(args.userId);
    return args.userId as Id<"users">;
  }

  if (args.clerkId) return lookupByClerk(args.clerkId);

  if (args.email) {
    throw new Error(
      "email lookup is not supported — the users table has no email index. Pass userId or clerkId instead."
    );
  }

  throw new Error(
    "sendTestNotificationToSelf requires one of: userId, clerkId. None were provided."
  );
}
