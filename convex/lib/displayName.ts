/**
 * Pull a usable first name out of the freeform displayName a user typed
 * (or that Clerk handed us). Used by the coach memory writer so facts
 * read like "Raj prefers morning workouts" instead of "User prefers...".
 *
 * Rules:
 *   - First whitespace-delimited token wins.
 *   - Strict allowlist: only Unicode letters, digits, hyphens, and
 *     apostrophes survive — covers "O'Brien" and "Mary-Anne" while
 *     stripping interior quotes/brackets/symbols that would otherwise
 *     escape the prompt's quoted "${firstName}" interpolation slot.
 *   - Edge hyphens and apostrophes are also trimmed.
 *   - Capped at 32 chars (defensive — we inject this into an LLM prompt).
 *   - Falls back to "They" when nothing usable is present.
 */
export function firstNameFrom(displayName: string | null | undefined): string {
  if (!displayName) return "They";
  const first = displayName.trim().split(/\s+/)[0] ?? "";
  const cleaned = first
    .replace(/[^\p{L}\p{N}\-']/gu, "")
    .replace(/^[\-']+|[\-']+$/g, "");
  if (!cleaned) return "They";
  return cleaned.slice(0, 32);
}
