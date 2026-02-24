import { QueryCtx, MutationCtx } from "../_generated/server";
import { Doc } from "../_generated/dataModel";

/**
 * Returns the authenticated user doc, or throws if not authenticated
 * or user record doesn't exist. Use in mutations where we must have a user.
 */
export async function getAuthenticatedUser(
  ctx: QueryCtx | MutationCtx
): Promise<Doc<"users">> {
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

  return user;
}

/**
 * Returns the authenticated user doc, or null if not authenticated
 * or user record doesn't exist yet (race during signup).
 * Use in queries that should gracefully degrade.
 */
export async function getAuthenticatedUserOrNull(
  ctx: QueryCtx | MutationCtx
): Promise<Doc<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  return await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .unique();
}
