/**
 * Persistence for the earned "star sticker" reward positions.
 *
 * When a day is fully complete, one gold star per task sticks to the page. The
 * user can drag each star anywhere on the notebook page; we remember where they
 * left them (per challenge-day) so the next visit replays the sticking
 * animation with the stars landing in their chosen spots.
 *
 * This is a purely cosmetic, device-local preference — it lives in localStorage
 * for guest AND signed-in users alike (no Convex round-trip needed). Positions
 * are stored as `{ x, y }` where `x` is a 0..1 fraction of the page width (so it
 * stays put across screen sizes) and `y` is a pixel offset from the page top.
 */

const KEY = "earned:stars:v1";

export type StarPos = { x: number; y: number };

type Store = Record<string, StarPos[]>;

function readStore(): Store {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? (parsed as Store) : {};
  } catch {
    return {};
  }
}

/**
 * Saved positions for a challenge-day, but only when they still match the
 * current star count (e.g. the habit list didn't change since they were
 * placed). Otherwise returns null so the caller falls back to the default row.
 */
export function loadStarPositions(key: string, expectedCount: number): StarPos[] | null {
  const saved = readStore()[key];
  if (
    Array.isArray(saved) &&
    saved.length === expectedCount &&
    saved.every((p) => p && typeof p.x === "number" && typeof p.y === "number")
  ) {
    return saved;
  }
  return null;
}

export function saveStarPositions(key: string, positions: StarPos[]): void {
  if (typeof window === "undefined") return;
  try {
    const all = readStore();
    all[key] = positions;
    window.localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    // Storage full / unavailable — positions just won't persist, no-op.
  }
}

/** Forget the user's saved arrangement for a day so the stars fall back to the
 *  default row (used by the "reset to row" control). */
export function clearStarPositions(key: string): void {
  if (typeof window === "undefined") return;
  try {
    const all = readStore();
    if (key in all) {
      delete all[key];
      window.localStorage.setItem(KEY, JSON.stringify(all));
    }
  } catch {
    // no-op
  }
}

/** Whether the user has a saved (custom) star arrangement for this day. */
export function hasStarArrangement(key: string): boolean {
  return Array.isArray(readStore()[key]);
}
