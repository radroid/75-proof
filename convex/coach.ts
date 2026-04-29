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
import { firstNameFrom } from "./lib/displayName";
import { MEMORY_BIO_CHAR_CAP } from "./lib/coachConstants";

// Default TTL in days for coach memory + threads. 90 days matches the
// retention contract called out in BACKLOG C-1/C-2.
export const DEFAULT_TTL_DAYS = 90;
// Cap thread message count returned to the client to keep payloads
// bounded. UI paginates beyond this.
const MESSAGE_PAGE_LIMIT = 200;
// Bound how many messages a single mutation can insert. Convex
// transactions have hard write caps; clients that exceed this almost
// certainly have a bug, so silently truncating is friendlier than
// throwing — they'll still see the most recent messages persist.
const MAX_MESSAGES_PER_CALL = 100;

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
    bio: string;
    updatedAt: number | null;
    expiresAt: number | null;
    firstName: string;
  } | null> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) return null;
    const firstName = firstNameFrom(user.displayName);
    const m = user.coachMemory;
    if (!m) {
      return {
        enabled: false,
        ttlDays: DEFAULT_TTL_DAYS,
        ttlOptOut: false,
        bio: "",
        updatedAt: null,
        expiresAt: null,
        firstName,
      };
    }
    const expiresAt = m.ttlOptOut
      ? null
      : m.updatedAt + m.ttlDays * 24 * 60 * 60 * 1000;
    return {
      enabled: m.enabled,
      ttlDays: m.ttlDays,
      ttlOptOut: m.ttlOptOut,
      bio: m.bio ?? "",
      updatedAt: m.updatedAt,
      expiresAt,
      firstName,
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
      bio: "bio" in current ? current.bio : undefined,
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
 * Inline-edit hook for the bio paragraph. The user owns this surface —
 * pencil-icon edit in CoachPrivacySettings calls in here. Empty string
 * clears the bio (without touching the master enabled toggle).
 */
export const updateBio = mutation({
  args: { bio: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const m = user.coachMemory;
    if (!m || !m.enabled) {
      throw new Error("Coach memory is not enabled");
    }
    const trimmed = args.bio.trim().slice(0, MEMORY_BIO_CHAR_CAP);
    // Idempotency + migration: skip the patch entirely when the bio
    // hasn't changed and there are no legacy facts left to clear.
    // Otherwise always clear `facts` — leaving them around after a
    // manual edit lets the writer fold them back into the bio later,
    // which would silently undo a user's clear.
    const existingBio = (m.bio ?? "").trim();
    const hasLegacyFacts = m.facts.length > 0;
    if (trimmed === existingBio && !hasLegacyFacts) return;
    await ctx.db.patch(user._id, {
      coachMemory: {
        ...m,
        bio: trimmed,
        facts: [],
        updatedAt: Date.now(),
      },
    });
    await logAudit(
      ctx,
      user._id,
      "memory_edit_manual",
      trimmed.length > 0 ? `bio edited (${trimmed.length} chars)` : "bio cleared",
    );
  },
});

/**
 * Internal: replace the user's bio paragraph. Called from the writer
 * action after the LLM returns a fresh paragraph (it sends UNCHANGED
 * when nothing durable was learned, in which case we never get here).
 * Also clears the legacy `facts` array on first successful write so
 * the migration path runs exactly once.
 */
export const replaceMemoryBio = internalMutation({
  args: {
    userId: v.id("users"),
    bio: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return;
    if (!user.coachMemory?.enabled) {
      // Memory was turned off between the writer firing and landing.
      // Don't write anything — keeps the opt-in contract.
      return;
    }
    const trimmed = args.bio.trim().slice(0, MEMORY_BIO_CHAR_CAP);
    if (!trimmed) return;
    // Idempotency: if the model emits a "new" bio that's actually
    // identical to what we already have, don't churn the audit log.
    // Defense-in-depth — the writer is supposed to send UNCHANGED in
    // this case, but we don't want a sloppy model to spam writes.
    // Still proceed if there are legacy facts left to clear, since
    // that's the migration path even when the bio text matches.
    const existingBio = user.coachMemory.bio ?? "";
    const hasLegacyFacts = user.coachMemory.facts.length > 0;
    if (trimmed === existingBio && !hasLegacyFacts) return;
    const next = {
      ...user.coachMemory,
      bio: trimmed,
      // Migration: once a bio lands, the legacy bullet list is stale.
      facts: [],
      updatedAt: Date.now(),
    };
    await ctx.db.patch(args.userId, { coachMemory: next });
    await ctx.db.insert("coachAuditLog", {
      userId: args.userId,
      action: "memory_write",
      detail: `bio updated (${trimmed.length} chars)`,
      createdAt: Date.now(),
    });
  },
});

/**
 * Internal: read memory for prompt injection. Returns the active bio
 * plus any legacy facts that haven't been folded in yet (used as
 * one-time seed context by the writer). The HTTP API route calls this
 * through the action runner so the chat endpoint can stay stateless.
 */
export const getMemoryByClerkId = internalQuery({
  args: { clerkId: v.string() },
  handler: async (ctx, args): Promise<{
    userId: Id<"users">;
    enabled: boolean;
    bio: string;
    legacyFacts: string[];
    firstName: string;
  } | null> => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();
    if (!user) return null;
    return {
      userId: user._id,
      enabled: user.coachMemory?.enabled ?? false,
      bio: user.coachMemory?.bio ?? "",
      legacyFacts: user.coachMemory?.facts ?? [],
      firstName: firstNameFrom(user.displayName),
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
      const slice = args.initialMessages.slice(0, MAX_MESSAGES_PER_CALL);
      let count = 0;
      for (const m of slice) {
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
    // Audit detail intentionally avoids the user-supplied title — that
    // string can carry PII (the user types it, and forgetMe preserves
    // the audit trail). Length is enough for diagnostic purposes.
    await logAudit(
      ctx,
      user._id,
      "thread_create",
      `source=${args.source}, titleLen=${title.length}`,
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
    const slice = args.messages.slice(0, MAX_MESSAGES_PER_CALL);
    let i = 0;
    for (const m of slice) {
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
      messageCount: thread.messageCount + slice.length,
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
    // Title omitted — same PII concern as thread_create. Message count
    // is plenty for an audit reader to recognise which thread it was.
    await logAudit(
      ctx,
      user._id,
      "thread_delete",
      `messages=${thread.messageCount}`,
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

    // 1. Memory blob: clear bio + legacy facts, leave settings (so
    // the user's preferences for opt-in/out persist after the wipe).
    if (user.coachMemory) {
      await ctx.db.patch(user._id, {
        coachMemory: {
          ...user.coachMemory,
          bio: "",
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
 * Internal: TTL purge. Walks every user, clears the memory bio older
 * than ttlDays, and deletes individual threads untouched past ttlDays.
 * Called daily by the cron in `convex/crons.ts`.
 *
 * Uses Convex's `paginate()` API and self-schedules the continuation
 * if there's a next page. This guarantees every user is processed each
 * full daily run, even at scale — the previous "single .take(batchSize)"
 * implementation starved every user past the first page.
 */
export const purgeExpired = internalMutation({
  args: {
    batchSize: v.optional(v.number()),
    cursor: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args): Promise<{
    memoryPurged: number;
    threadsPurged: number;
    isDone: boolean;
  }> => {
    const numItems = args.batchSize ?? 50;
    const cursor = args.cursor ?? null;
    const now = Date.now();

    const page = await ctx.db.query("users").paginate({ numItems, cursor });

    let memoryPurged = 0;
    let threadsPurged = 0;

    for (const u of page.page) {
      // Memory.
      const m = u.coachMemory;
      const hasContent = !!m && (!!m.bio || m.facts.length > 0);
      if (m && !m.ttlOptOut && hasContent) {
        const expiresAt = m.updatedAt + m.ttlDays * 24 * 60 * 60 * 1000;
        if (now >= expiresAt) {
          await ctx.db.patch(u._id, {
            coachMemory: { ...m, bio: "", facts: [], updatedAt: now },
          });
          await ctx.db.insert("coachAuditLog", {
            userId: u._id,
            action: "memory_purge_ttl",
            detail: `purged memory past ${m.ttlDays}-day TTL`,
            createdAt: now,
          });
          memoryPurged += 1;
        }
      }

      // Threads (skipped when the user opted out of TTL).
      const ttlDays = u.coachMemory?.ttlOptOut
        ? null
        : u.coachMemory?.ttlDays ?? DEFAULT_TTL_DAYS;
      if (ttlDays !== null) {
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
    }

    if (!page.isDone) {
      // Schedule the continuation. runAfter(0) keeps each invocation
      // within transaction limits while still completing the full pass
      // promptly.
      await ctx.scheduler.runAfter(0, internal.coach.purgeExpired, {
        batchSize: numItems,
        cursor: page.continueCursor,
      });
    }

    return { memoryPurged, threadsPurged, isDone: page.isDone };
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
    // Defensive: clamp to a sane positive integer. Negative or
    // non-finite values would throw inside .take(); we'd rather return
    // a small page than 500.
    const requested = args.limit ?? 100;
    const limit = Math.max(
      1,
      Math.min(Math.floor(Number.isFinite(requested) ? requested : 100), 500),
    );
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

// Hard ceilings to keep the export query inside Convex's per-query
// read limit. They're high enough that real users won't hit them; if
// any is reached, the response surfaces a `truncated` flag so the
// downloaded bundle is not silently incomplete (per BACKLOG C-5
// "completeness expectations").
const EXPORT_MAX_THREADS = 1000;
const EXPORT_MAX_MESSAGES_PER_THREAD = 2000;
const EXPORT_MAX_AUDIT = 5000;

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

    // Threads — read up to the cap, flag truncation if hit.
    const threads = await ctx.db
      .query("coachThreads")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .take(EXPORT_MAX_THREADS);
    const threadsTruncated = threads.length === EXPORT_MAX_THREADS;

    const threadsWithMessages: Array<{
      title: string;
      source: string;
      createdAt: number;
      updatedAt: number;
      truncated: boolean;
      messages: Array<{ role: string; content: string; createdAt: number }>;
    }> = [];
    for (const t of threads) {
      const messages = await ctx.db
        .query("coachMessages")
        .withIndex("by_thread_created", (q) => q.eq("threadId", t._id))
        .order("asc")
        .take(EXPORT_MAX_MESSAGES_PER_THREAD);
      threadsWithMessages.push({
        title: t.title,
        source: t.source,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        truncated: messages.length === EXPORT_MAX_MESSAGES_PER_THREAD,
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
      .take(EXPORT_MAX_AUDIT);
    const auditTruncated = audit.length === EXPORT_MAX_AUDIT;

    return {
      memory: user.coachMemory ?? null,
      threads: threadsWithMessages,
      audit: audit.map((a) => ({
        action: a.action,
        detail: a.detail,
        createdAt: a.createdAt,
      })),
      truncation: {
        threads: threadsTruncated,
        audit: auditTruncated,
        // Per-thread truncation lives on each thread doc above; this
        // top-level convenience flag is true iff any thread was clipped.
        anyMessages: threadsWithMessages.some((t) => t.truncated),
        limits: {
          maxThreads: EXPORT_MAX_THREADS,
          maxMessagesPerThread: EXPORT_MAX_MESSAGES_PER_THREAD,
          maxAudit: EXPORT_MAX_AUDIT,
        },
      },
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

type ExportSnapshot = {
  memory: Doc<"users">["coachMemory"] | null;
  threads: Array<{
    title: string;
    source: string;
    createdAt: number;
    updatedAt: number;
    truncated: boolean;
    messages: Array<{ role: string; content: string; createdAt: number }>;
  }>;
  audit: Array<{ action: string; detail: string; createdAt: number }>;
  truncation: {
    threads: boolean;
    audit: boolean;
    anyMessages: boolean;
    limits: {
      maxThreads: number;
      maxMessagesPerThread: number;
      maxAudit: number;
    };
  };
};

/**
 * Public action: build the export bundle for the calling user and log
 * the export to the audit trail. Wraps the internal query (paginated
 * read) and the internal mutation (audit insert).
 */
export const exportSnapshot = action({
  args: {},
  handler: async (ctx): Promise<ExportSnapshot> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const userId: Id<"users"> | null = await ctx.runQuery(
      api.coach.resolveSelfUserId,
      {},
    );
    if (!userId) throw new Error("User not found");

    const snapshot: ExportSnapshot = await ctx.runQuery(
      internal.coach.buildExportSnapshot,
      { userId },
    );

    const bytes = new TextEncoder().encode(JSON.stringify(snapshot)).byteLength;
    await ctx.runMutation(internal.coach.recordExport, { userId, bytes });

    return snapshot;
  },
});
