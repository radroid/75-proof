import { v } from "convex/values";
import { mutation, query, MutationCtx } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { getAuthenticatedUser, getAuthenticatedUserOrNull } from "./lib/auth";

/**
 * After-work Plan backend. The Plan page is a *scheduling overlay*: these
 * functions own block placement (start + duration) only. Habit completion
 * stays in `habitEntries` via the existing toggle mutations — a block is
 * "done" iff its habit's entry for the day is completed.
 *
 * Auth is always derived server-side; block mutations verify ownership.
 */

const blockInput = v.object({
  habitDefinitionId: v.optional(v.id("habitDefinitions")),
  kind: v.union(
    v.literal("habit"),
    v.literal("break"),
    v.literal("custom"),
    v.literal("busy"),
  ),
  title: v.optional(v.string()),
  startMin: v.number(),
  durationMin: v.number(),
  reminderEnabled: v.boolean(),
});

const workScheduleInput = v.object({
  defaultStart: v.string(),
  defaultEnd: v.string(),
  windDownAt: v.string(),
  workdays: v.array(v.number()),
});

/** Read today's (or any day's) plan header + blocks + the user's saved schedule. */
export const getPlanForDay = query({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUserOrNull(ctx);
    if (!user) {
      return { plan: null, blocks: [], workSchedule: null, challengeId: null };
    }

    const plan = await ctx.db
      .query("dayPlans")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", user._id).eq("date", args.date),
      )
      .unique();

    const blocks = await ctx.db
      .query("planBlocks")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", user._id).eq("date", args.date),
      )
      .take(200);

    return {
      plan,
      blocks: blocks.sort((a, b) => a.startMin - b.startMin),
      workSchedule: user.preferences.workSchedule ?? null,
      challengeId: user.currentChallengeId ?? null,
    };
  },
});

/** Resolve (or lazily create) the dayPlan row for a user + date. */
async function getOrCreatePlan(
  ctx: MutationCtx,
  user: Doc<"users">,
  args: {
    date: string;
    workStart: string | null;
    workEnd: string | null;
    windDownAt: string;
  },
): Promise<Doc<"dayPlans">> {
  const existing = await ctx.db
    .query("dayPlans")
    .withIndex("by_user_date", (q) =>
      q.eq("userId", user._id).eq("date", args.date),
    )
    .unique();
  if (existing) return existing;

  if (!user.currentChallengeId) {
    throw new Error("No active challenge");
  }
  const id = await ctx.db.insert("dayPlans", {
    userId: user._id,
    challengeId: user.currentChallengeId,
    date: args.date,
    workStart: args.workStart,
    workEnd: args.workEnd,
    windDownAt: args.windDownAt,
  });
  const created = await ctx.db.get(id);
  if (!created) throw new Error("Failed to create dayPlan");
  return created;
}

/**
 * Idempotent seed of today's plan header. Safe to call on every Plan page
 * load — returns the existing row untouched if one already exists.
 */
export const ensureToday = mutation({
  args: {
    date: v.string(),
    workStart: v.union(v.string(), v.null()),
    workEnd: v.union(v.string(), v.null()),
    windDownAt: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const plan = await getOrCreatePlan(ctx, user, args);
    return plan._id;
  },
});

/** Set (or change) the work window + wind-down for a given day. */
export const setWorkHours = mutation({
  args: {
    date: v.string(),
    workStart: v.union(v.string(), v.null()),
    workEnd: v.union(v.string(), v.null()),
    windDownAt: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const plan = await getOrCreatePlan(ctx, user, args);
    await ctx.db.patch(plan._id, {
      workStart: args.workStart,
      workEnd: args.workEnd,
      windDownAt: args.windDownAt,
    });
    return plan._id;
  },
});

/** Persist the user's saved "usual" schedule (pre-fills future days). */
export const saveWorkScheduleDefault = mutation({
  args: { workSchedule: workScheduleInput },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    await ctx.db.patch(user._id, {
      preferences: { ...user.preferences, workSchedule: args.workSchedule },
    });
    return null;
  },
});

/**
 * Replace ALL blocks for a day with the given set. Used by auto-arrange and
 * any bulk placement change. Clears reminder-sent flags (a re-arranged block
 * should be eligible to remind again if its new time is still ahead).
 */
export const replacePlannedBlocks = mutation({
  args: {
    date: v.string(),
    workStart: v.union(v.string(), v.null()),
    workEnd: v.union(v.string(), v.null()),
    windDownAt: v.string(),
    blocks: v.array(blockInput),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const plan = await getOrCreatePlan(ctx, user, args);

    // Delete existing blocks for the day.
    const existing = await ctx.db
      .query("planBlocks")
      .withIndex("by_dayPlan", (q) => q.eq("dayPlanId", plan._id))
      .take(500);
    for (const b of existing) {
      await ctx.db.delete(b._id);
    }

    for (const b of args.blocks) {
      await ctx.db.insert("planBlocks", {
        userId: user._id,
        dayPlanId: plan._id,
        date: args.date,
        habitDefinitionId: b.habitDefinitionId,
        kind: b.kind,
        title: b.title,
        startMin: b.startMin,
        durationMin: b.durationMin,
        reminderEnabled: b.reminderEnabled,
      });
    }
    await ctx.db.patch(plan._id, { arrangedAt: Date.now() });
    return plan._id;
  },
});

/** Add a single block (one-off custom/break, or a habit dragged from the tray). */
export const addBlock = mutation({
  args: {
    date: v.string(),
    workStart: v.union(v.string(), v.null()),
    workEnd: v.union(v.string(), v.null()),
    windDownAt: v.string(),
    block: blockInput,
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const plan = await getOrCreatePlan(ctx, user, args);
    const id = await ctx.db.insert("planBlocks", {
      userId: user._id,
      dayPlanId: plan._id,
      date: args.date,
      habitDefinitionId: args.block.habitDefinitionId,
      kind: args.block.kind,
      title: args.block.title,
      startMin: args.block.startMin,
      durationMin: args.block.durationMin,
      reminderEnabled: args.block.reminderEnabled,
    });
    return id;
  },
});

/** Verify a block belongs to the caller, returning it. */
async function ownedBlock(
  ctx: MutationCtx,
  user: Doc<"users">,
  blockId: Id<"planBlocks">,
): Promise<Doc<"planBlocks">> {
  const block = await ctx.db.get(blockId);
  if (!block || block.userId !== user._id) {
    throw new Error("Block not found");
  }
  return block;
}

/** Move a block (drag) — changes its start time. Re-arms its reminder. */
export const moveBlock = mutation({
  args: { blockId: v.id("planBlocks"), startMin: v.number() },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    await ownedBlock(ctx, user, args.blockId);
    await ctx.db.patch(args.blockId, {
      startMin: args.startMin,
      reminderSentAt: undefined,
    });
    return null;
  },
});

/** Resize a block (edge drag) — changes start and/or duration. */
export const resizeBlock = mutation({
  args: {
    blockId: v.id("planBlocks"),
    startMin: v.number(),
    durationMin: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    await ownedBlock(ctx, user, args.blockId);
    await ctx.db.patch(args.blockId, {
      startMin: args.startMin,
      durationMin: Math.max(5, args.durationMin),
      reminderSentAt: undefined,
    });
    return null;
  },
});

/** Remove a block from the timeline. */
export const removeBlock = mutation({
  args: { blockId: v.id("planBlocks") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    await ownedBlock(ctx, user, args.blockId);
    await ctx.db.delete(args.blockId);
    return null;
  },
});

/** Toggle a block's reminder. Re-enabling clears any prior sent flag. */
export const setBlockReminder = mutation({
  args: { blockId: v.id("planBlocks"), enabled: v.boolean() },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    await ownedBlock(ctx, user, args.blockId);
    await ctx.db.patch(args.blockId, {
      reminderEnabled: args.enabled,
      // Clear any prior delivery flag so a re-enabled reminder can fire again.
      reminderSentAt: undefined,
    });
    return null;
  },
});

/** Verify a habit definition belongs to the caller. */
async function ownedHabit(
  ctx: MutationCtx,
  user: Doc<"users">,
  habitDefinitionId: Id<"habitDefinitions">,
): Promise<Doc<"habitDefinitions">> {
  const habit = await ctx.db.get(habitDefinitionId);
  if (!habit || habit.userId !== user._id) {
    throw new Error("Habit not found");
  }
  return habit;
}

/** Persist a habit's timeline/anytime placement (move between rail and tray). */
export const setHabitPlacement = mutation({
  args: {
    habitDefinitionId: v.id("habitDefinitions"),
    placement: v.union(v.literal("timeline"), v.literal("anytime")),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    await ownedHabit(ctx, user, args.habitDefinitionId);
    await ctx.db.patch(args.habitDefinitionId, {
      defaultPlacement: args.placement,
    });
    return null;
  },
});

/** Persist a habit's estimated block length (inline duration edit). */
export const setHabitDuration = mutation({
  args: {
    habitDefinitionId: v.id("habitDefinitions"),
    estimatedMinutes: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    await ownedHabit(ctx, user, args.habitDefinitionId);
    await ctx.db.patch(args.habitDefinitionId, {
      estimatedMinutes: Math.max(5, Math.min(240, Math.round(args.estimatedMinutes))),
    });
    return null;
  },
});
