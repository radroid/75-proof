import { v } from "convex/values";
import {
  internalAction,
  internalMutation,
  query,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { ROUTINE_TEMPLATE_SEEDS } from "./lib/routineTemplatesSeed";

/**
 * Returns the curated routine catalog. v1 falls back to the static seed
 * list when the `routineTemplates` table is empty — catalog ingestion via
 * the deep-research agent (and the dormant `seedTemplates` action below)
 * lands in a follow-up branch.
 */
export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const stored = await ctx.db.query("routineTemplates").collect();
    if (stored.length === 0) {
      return ROUTINE_TEMPLATE_SEEDS;
    }
    return stored.map(stripStorageFields);
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const stored = await ctx.db
      .query("routineTemplates")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (stored) return stripStorageFields(stored);
    return ROUTINE_TEMPLATE_SEEDS.find((t) => t.slug === args.slug) ?? null;
  },
});

/**
 * Idempotent seed of the static catalog into the `routineTemplates` table.
 * NOT invoked by any code path in this PR — kept here so the follow-up
 * deep-research ingestion can plug into the same upsert pattern.
 */
export const seedTemplates = internalAction({
  args: {},
  handler: async (ctx): Promise<{ inserted: number; updated: number }> => {
    return await ctx.runMutation(internal.routineTemplates._upsertSeeds, {});
  },
});

export const _upsertSeeds = internalMutation({
  args: {},
  handler: async (ctx) => {
    let inserted = 0;
    let updated = 0;
    for (const seed of ROUTINE_TEMPLATE_SEEDS) {
      const existing = await ctx.db
        .query("routineTemplates")
        .withIndex("by_slug", (q) => q.eq("slug", seed.slug))
        .unique();
      if (existing) {
        await ctx.db.patch(existing._id, seed);
        updated += 1;
      } else {
        await ctx.db.insert("routineTemplates", seed);
        inserted += 1;
      }
    }
    return { inserted, updated };
  },
});

function stripStorageFields<T extends { _id: unknown; _creationTime: unknown }>(
  doc: T,
): Omit<T, "_id" | "_creationTime"> {
  const rest = { ...doc } as Omit<T, "_id" | "_creationTime"> &
    Partial<Pick<T, "_id" | "_creationTime">>;
  delete rest._id;
  delete rest._creationTime;
  return rest;
}
