/**
 * Shared normalization for the user-authored identity statement (PD-8).
 *
 * Used by both `setIdentityStatement` (settings UI mutation) and
 * `completeOnboarding` (final wizard step) so the trim/cap/clear semantics
 * stay aligned. Truncate rather than throw — clients can paste arbitrary
 * input and a UTF-8-bloated 140-char paste shouldn't surprise them; the cap
 * is a presentation choice, not a correctness one.
 */
export const IDENTITY_STATEMENT_MAX_LEN = 140;

export interface NormalizedIdentityStatement {
  /** The trimmed, capped string ready to persist (empty string if cleared). */
  value: string;
  /** True when the caller asked to clear (null in, or empty after trim). */
  cleared: boolean;
}

export function normalizeIdentityStatement(
  raw: string | null | undefined,
): NormalizedIdentityStatement {
  if (raw === null || raw === undefined) return { value: "", cleared: true };
  const trimmed = typeof raw === "string" ? raw.trim() : "";
  const capped = trimmed.slice(0, IDENTITY_STATEMENT_MAX_LEN);
  return { value: capped, cleared: capped.length === 0 };
}
