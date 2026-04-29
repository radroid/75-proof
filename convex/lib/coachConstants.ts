/**
 * Single source of truth for coach memory limits. Imported by both
 * Convex server code (writer + mutations) and client UI (textarea
 * counter / max-length) so they can't drift apart.
 *
 * This module must stay free of Convex server-only imports — it's
 * pulled into the Next.js client bundle via CoachPrivacySettings.
 */

// Max characters in the persisted bio paragraph. ~2-4 sentences of
// warm prose. The writer is told to stay well under; mutations re-cap
// here as defense-in-depth, and the textarea UI uses it for the
// counter and maxLength.
export const MEMORY_BIO_CHAR_CAP = 600;
