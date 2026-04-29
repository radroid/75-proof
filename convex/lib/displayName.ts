/**
 * Pull a usable first name out of the freeform displayName a user typed
 * (or that Clerk handed us). Used by the coach memory writer so facts
 * read like "Raj prefers morning workouts" instead of "User prefers...".
 *
 * Rules:
 *   - First whitespace-delimited token wins.
 *   - Stripped of surrounding punctuation so "Raj," → "Raj".
 *   - Capped at 32 chars (defensive — we inject this into an LLM prompt).
 *   - Falls back to "They" when nothing usable is present.
 */
export function firstNameFrom(displayName: string | null | undefined): string {
  if (!displayName) return "They";
  const first = displayName.trim().split(/\s+/)[0] ?? "";
  const cleaned = first.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
  if (!cleaned) return "They";
  return cleaned.slice(0, 32);
}
