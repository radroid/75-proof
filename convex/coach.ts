import { v } from "convex/values";
import {
  action,
  mutation,
  query,
  internalMutation,
  internalQuery,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import { api, internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";

// Default TTL in days for coach memory + threads. 90 days matches the
// retention contract called out in BACKLOG C-1/C-2.
export const DEFAULT_TTL_DAYS = 90;
// Hard cap on the persisted memory blob. The writer prompt is told to
// stay well under this; we re-check here so a misbehaving model can't
// blow past the limit. ~2KB matches the spec.
export const MEMORY_BYTE_CAP = 2048;
// Cap thread message count returned to the client to keep payloads
// bounded. UI paginates beyond this.
const MESSAGE_PAGE_LIMIT = 200;

async function requireUser(ctx: QueryCtx | MutationCtx): Promise<Doc<"users">> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .unique();
  if (!user) throw new Error("User not found");
  return user;
}

async function logAudit(
  ctx: MutationCtx,
  userId: Id<"users">,
  action: Doc<"coachAuditLog">["action"],
  detail: string,
): Promise<void> {
  await ctx.db.insert("coachAuditLog", {
    userId,
    action,
    detail,
    createdAt: Date.now(),
  });
}

// ============================================================================
// C-1 — Coach memory
// ============================================================================

export const getMemory = query({
  args: {},
  handler: async (
    ctx,
  ): Promise<{
    enabled: boolean;
    ttlDays: number;
    ttlOptOut: boolean;
    facts: string[];
    updatedAt: number | null;
    expiresAt: number | null;
  } | null> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) return null;
    const m = user.coachMemory;
    if (!m) {
      return {
        enabled: false,
        ttlDays: DEFAULT_TTL_DAYS,
        ttlOptOut: false,
        facts: [],
        updatedAt: null,
        expiresAt: null,
      };
    }
    const expiresAt = m.ttlOptOut
      ? null
      : m.updatedAt + m.ttlDays * 24 * 60 * 60 * 1000;
    return {
      enabled: m.enabled,
      ttlDays: m.ttlDays,
      ttlOptOut: m.ttlOptOut,
      facts: m.facts,
      updatedAt: m.updatedAt,
      expiresAt,
    };
  },
});

export const updateMemorySettings = mutation({
  args: {
    enabled: v.optional(v.boolean()),
    ttlDays: v.optional(v.number()),
    ttlOptOut: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const current = user.coachMemory ?? {
      enabled: false,
      ttlDays: DEFAULT_TTL_DAYS,
      ttlOptOut: false,
      facts: [],
      updatedAt: Date.now(),
    };
    // Validate ttlDays — keep it bounded so a bad client can't disable
    // purge by setting it to 100 years.
    let nextTtlDays = current.ttlDays;
    if (args.ttlDays !== undefined) {
      if (
        !Number.isFinite(args.ttlDays) ||
        !Number.isInteger(args.ttlDays) ||
        args.ttlDays < 7 ||
        args.ttlDays > 365
      ) {
        throw new Error("ttlDays must be an integer between 7 and 365");
      }
      nextTtlDays = args.ttlDays;
    }
    const next = {
      enabled: args.enabled ?? current.enabled,
      ttlDays: nextTtlDays,
      ttlOptOut: args.ttlOptOut ?? current.ttlOptOut,
      facts: current.facts,
      updatedAt: current.updatedAt,
    };
    await ctx.db.patch(user._id, { coachMemory: next });
    await logAudit(
      ctx,
      user._id,
      "memory_settings_changed",
      `enabled=${next.enabled}, ttlDays=${next.ttlDays}, ttlOptOut=${next.ttlOptOut}`,
    );
  },
});

/**
 * Internal: replace the user's distilled memory facts. Called from the
 * writer action after the LLM returns a new snapshot. Truncates if the
 * blob exceeds MEMORY_BYTE_CAP — preference is to drop the oldest
 * facts, since the writer is told to put the most durable ones first.
 */
export const replaceMemoryFacts = internalMutation({
  args: {
    userId: v.id("users"),
    facts: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return;
    if (!user.coachMemory?.enabled) {
      // Memory was turned off between the writer firing and landing.
      // Don't write anything — keeps the opt-in contract.
      return;
    }
    const trimmed = enforceByteCap(args.facts);
    const next = {
      ...user.coachMemory,
      facts: trimmed,
      updatedAt: Date.now(),
    };
    await ctx.db.patch(args.userId, { coachMemory: next });
    await ctx.db.insert("coachAuditLog", {
      userId: args.userId,
      action: "memory_write",
      detail: `${trimmed.length} fact${trimmed.length === 1 ? "" : "s"}, ${
        byteLengthOf(trimmed)
      } bytes`,
      createdAt: Date.now(),
    });
  },
});

function byteLengthOf(facts: string[]): number {
  let total = 0;
  for (const f of facts) total += new TextEncoder().encode(f).byteLength;
  return total;
}

function enforceByteCap(facts: string[]): string[] {
  // Drop oldest until under cap. The writer is instructed to put the
  // most durable / load-bearing facts first.
  const out = [...facts];
  while (out.length > 0 && byteLengthOf(out) > MEMORY_BYTE_CAP) {
    out.pop();
  }
  return out;
}

/**
 * Internal: read memory facts for prompt injection. The HTTP API route
 * calls this through the action runner so the chat endpoint can stay
 * stateless.
 */
export const getMemoryByClerkId = internalQuery({
  args: { clerkId: v.string() },
  handler: async (ctx, args): Promise<{
    userId: Id<"users">;
    enabled: boolean;
    facts: string[];
  } | null> => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();
    if (!user) return null;
    return {
      userId: user._id,
      enabled: user.coachMemory?.enabled ?? false,
      facts: user.coachMemory?.facts ?? [],
    };
  },
});

// ============================================================================
// C-2 — Threads + messages
// ============================================================================

export const createThread = mutation({
  args: {
    title: v.string(),
    source: v.union(
      v.literal("onboarding"),
      v.literal("coach"),
      v.literal("imported"),
    ),
    initialMessages: v.optional(
      v.array(
        v.object({
          role: v.union(v.literal("user"), v.literal("assistant")),
          content: v.string(),
        }),
      ),
    ),
  },
  handler: async (ctx, args): Promise<Id<"coachThreads">> => {
    const user = await requireUser(ctx);
    const now = Date.now();
    const title = args.title.trim().slice(0, 120) || "Untitled thread";
    const threadId = await ctx.db.insert("coachThreads", {
      userId: user._id,
      title,
      source: args.source,
      createdAt: now,
      updatedAt: now,
      messageCount: 0,
    });
    if (args.initialMessages && args.initialMessages.length > 0) {
      let count = 0;
      for (const m of args.initialMessages) {
        if (typeof m.content !== "string") continue;
        await ctx.db.insert("coachMessages", {
          threadId,
          userId: user._id,
          role: m.role,
          content: m.content.slice(0, 8000),
          createdAt: now + count,
        });
        count += 1;
      }
      await ctx.db.patch(threadId, {
        messageCount: count,
        updatedAt: now,
      });
    }
    await logAudit(
      ctx,
      user._id,
      "thread_create",
      `source=${args.source}, title="${title}"`,
    );
    return threadId;
  },
});

export const appendMessages = mutation({
  args: {
    threadId: v.id("coachThreads"),
    messages: v.array(
      v.object({
        role: v.union(v.literal("user"), v.literal("assistant")),
        content: v.string(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const thread = await ctx.db.get(args.threadId);
    if (!thread || thread.userId !== user._id) {
      throw new Error("Thread not found");
    }
    const now = Date.now();
    let i = 0;
    for (const m of args.messages) {
      await ctx.db.insert("coachMessages", {
        threadId: args.threadId,
        userId: user._id,
        role: m.role,
        content: m.content.slice(0, 8000),
        createdAt: now + i,
      });
      i += 1;
    }
    await ctx.db.patch(args.threadId, {
      messageCount: thread.messageCount + args.messages.length,
      updatedAt: now,
    });
  },
});

export const listThreads = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) return [];
    const threads = await ctx.db
      .query("coachThreads")
      .withIndex("by_user_updated", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(50);
    return threads.map((t) => ({
      _id: t._id,
      title: t.title,
      source: t.source,
      messageCount: t.messageCount,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));
  },
});

export const getThread = query({
  args: { threadId: v.id("coachThreads") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) return null;
    const thread = await ctx.db.get(args.threadId);
    if (!thread || thread.userId !== user._id) return null;
    const messages = await ctx.db
      .query("coachMessages")
      .withIndex("by_thread_created", (q) => q.eq("threadId", args.threadId))
      .order("asc")
      .take(MESSAGE_PAGE_LIMIT);
    return {
      thread: {
        _id: thread._id,
        title: thread.title,
        source: thread.source,
        createdAt: thread.createdAt,
        updatedAt: thread.updatedAt,
        messageCount: thread.messageCount,
      },
      messages: messages.map((m) => ({
        _id: m._id,
        role: m.role,
        content: m.content,
        createdAt: m.createdAt,
      })),
    };
  },
});

export const deleteThread = mutation({
  args: { threadId: v.id("coachThreads") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const thread = await ctx.db.get(args.threadId);
    if (!thread || thread.userId !== user._id) {
      throw new Error("Thread not found");
    }
    await deleteAllMessagesForThread(ctx, args.threadId);
    await ctx.db.delete(args.threadId);
    await logAudit(
      ctx,
      user._id,
      "thread_delete",
      `title="${thread.title}", messages=${thread.messageCount}`,
    );
  },
});

async function deleteAllMessagesForThread(
  ctx: MutationCtx,
  threadId: Id<"coachThreads">,
): Promise<void> {
  // Bounded loop — Convex mutations have transaction limits, so we
  // walk in batches of 100 until empty.
  for (;;) {
    const batch = await ctx.db
      .query("coachMessages")
      .withIndex("by_thread", (q) => q.eq("threadId", threadId))
      .take(100);
    if (batch.length === 0) break;
    for (const row of batch) {
      await ctx.db.delete(row._id);
    }
    if (batch.length < 100) break;
  }
}

// ============================================================================
// C-1 — "Forget me" and TTL purge
// ============================================================================

export const forgetMe = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    // Record the audit entry first so the user has a record of the
    // intent even if the cascade is partial. We then cascade memory +
    // threads + messages. Audit log itself is preserved (so the user
    // can prove the purge happened); UI offers a separate purge for it.
    await logAudit(ctx, user._id, "forget_me", "purging memory and threads");

    // 1. Memory blob: clear facts, leave settings (so the user's
    // preferences for opt-in/out persist after the wipe).
    if (user.coachMemory) {
      await ctx.db.patch(user._id, {
        coachMemory: {
          ...user.coachMemory,
          facts: [],
          updatedAt: Date.now(),
        },
      });
    }

    // 2. Threads + messages.
    for (;;) {
      const threads = await ctx.db
        .query("coachThreads")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .take(20);
      if (threads.length === 0) break;
      for (const t of threads) {
        await deleteAllMessagesForThread(ctx, t._id);
        await ctx.db.delete(t._id);
      }
      if (threads.length < 20) break;
    }
  },
});

/**
 * Internal: TTL purge. Walks users with memory enabled and clears facts
 * older than ttlDays; deletes individual threads older than ttlDays.
 * Called by a cron in `convex/crons.ts`.
 *
 * Bounded by `batchSize` so a single invocation stays within transaction
 * limits; the cron re-runs frequently enough that any remaining work
 * gets cleaned up on subsequent passes.
 */
export const purgeExpired = internalMutation({
  args: { batchSize: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.batchSize ?? 50;
    const now = Date.now();

    // Memory: scan users page-by-page; cheap at small scale, fine to
    // re-scan as the cron only fires daily.
    const users = await ctx.db.query("users").take(limit);
    let memoryPurged = 0;
    for (const u of users) {
      const m = u.coachMemory;
      if (!m || m.ttlOptOut) continue;
      if (m.facts.length === 0) continue;
      const expiresAt = m.updatedAt + m.ttlDays * 24 * 60 * 60 * 1000;
      if (now < expiresAt) continue;
      await ctx.db.patch(u._id, {
        coachMemory: { ...m, facts: [], updatedAt: now },
      });
      await ctx.db.insert("coachAuditLog", {
        userId: u._id,
        action: "memory_purge_ttl",
        detail: `purged ${m.facts.length} fact(s) past ${m.ttlDays}-day TTL`,
        createdAt: now,
      });
      memoryPurged += 1;
    }

    // Threads: any thread untouched for ttlDays gets deleted. We use
    // each user's setting; falling back to default if unset.
    let threadsPurged = 0;
    for (const u of users) {
      const ttlDays = u.coachMemory?.ttlOptOut
        ? null
        : u.coachMemory?.ttlDays ?? DEFAULT_TTL_DAYS;
      if (ttlDays === null) continue;
      const cutoff = now - ttlDays * 24 * 60 * 60 * 1000;
      const expired = await ctx.db
        .query("coachThreads")
        .withIndex("by_user_updated", (q) =>
          q.eq("userId", u._id).lt("updatedAt", cutoff),
        )
        .take(20);
      for (const t of expired) {
        await deleteAllMessagesForThread(ctx, t._id);
        await ctx.db.delete(t._id);
        threadsPurged += 1;
      }
      if (expired.length > 0) {
        await ctx.db.insert("coachAuditLog", {
          userId: u._id,
          action: "memory_purge_ttl",
          detail: `purged ${expired.length} expired thread(s)`,
          createdAt: now,
        });
      }
    }

    return { memoryPurged, threadsPurged };
  },
});

// ============================================================================
// C-1/C-5 — Audit log
// ============================================================================

export const listAuditLog = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) return [];
    const limit = Math.min(args.limit ?? 100, 500);
    const rows = await ctx.db
      .query("coachAuditLog")
      .withIndex("by_user_created", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(limit);
    return rows.map((r) => ({
      _id: r._id,
      action: r.action,
      detail: r.detail,
      createdAt: r.createdAt,
    }));
  },
});

// ============================================================================
// C-5 — Export bundle
// ============================================================================

/**
 * Internal: assemble the full bundle. Called by an action that records
 * the export audit entry (audit writes need a mutation context, queries
 * can't insert).
 */
export const buildExportSnapshot = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");
    const threads = await ctx.db
      .query("coachThreads")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .take(200);
    const threadsWithMessages: Array<{
      title: string;
      source: string;
      createdAt: number;
      updatedAt: number;
      messages: Array<{ role: string; content: string; createdAt: number }>;
    }> = [];
    for (const t of threads) {
      const messages = await ctx.db
        .query("coachMessages")
        .withIndex("by_thread_created", (q) => q.eq("threadId", t._id))
        .order("asc")
        .take(500);
      threadsWithMessages.push({
        title: t.title,
        source: t.source,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
          createdAt: m.createdAt,
        })),
      });
    }
    const audit = await ctx.db
      .query("coachAuditLog")
      .withIndex("by_user_created", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(500);
    return {
      memory: user.coachMemory ?? null,
      threads: threadsWithMessages,
      audit: audit.map((a) => ({
        action: a.action,
        detail: a.detail,
        createdAt: a.createdAt,
      })),
    };
  },
});

/**
 * Internal: record the export action. Pulled out from the bundle build
 * so the build can stay in a query (cheap, paginated) and the audit
 * entry happens in a mutation.
 */
export const recordExport = internalMutation({
  args: { userId: v.id("users"), bytes: v.number() },
  handler: async (ctx, args) => {
    await ctx.db.insert("coachAuditLog", {
      userId: args.userId,
      action: "export",
      detail: `exported context bundle (${args.bytes} bytes)`,
      createdAt: Date.now(),
    });
  },
});

/**
 * Resolve the calling Clerk user to a Convex userId. Public so the
 * /api/coach/export route can authenticate via Convex auth and then
 * fan out the internal calls.
 */
export const resolveSelfUserId = query({
  args: {},
  handler: async (ctx): Promise<Id<"users"> | null> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    return user?._id ?? null;
  },
});

/**
 * Public action: build the export bundle for the calling user and log
 * the export to the audit trail. Wraps the internal query (paginated
 * read) and the internal mutation (audit insert).
 */
export const exportSnapshot = action({
  args: {},
  handler: async (
    ctx,
  ): Promise<{
    memory: Doc<"users">["coachMemory"] | null;
    threads: Array<{
      title: string;
      source: string;
      createdAt: number;
      updatedAt: number;
      messages: Array<{ role: string; content: string; createdAt: number }>;
    }>;
    audit: Array<{ action: string; detail: string; createdAt: number }>;
  }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const userId: Id<"users"> | null = await ctx.runQuery(
      api.coach.resolveSelfUserId,
      {},
    );
    if (!userId) throw new Error("User not found");

    const snapshot: {
      memory: Doc<"users">["coachMemory"] | null;
      threads: Array<{
        title: string;
        source: string;
        createdAt: number;
        updatedAt: number;
        messages: Array<{ role: string; content: string; createdAt: number }>;
      }>;
      audit: Array<{ action: string; detail: string; createdAt: number }>;
    } = await ctx.runQuery(internal.coach.buildExportSnapshot, { userId });

    const bytes = new TextEncoder().encode(JSON.stringify(snapshot)).byteLength;
    await ctx.runMutation(internal.coach.recordExport, { userId, bytes });

    return snapshot;
  },
});
