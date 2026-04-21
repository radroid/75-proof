"use client";

/**
 * Lightweight haptic feedback via `navigator.vibrate`.
 *
 * No-ops on:
 *  - SSR (no navigator)
 *  - Browsers without the Vibration API (desktop Safari, iOS Safari pre-18,
 *    some Firefox builds)
 *  - Users who prefer reduced motion
 *  - Users who've turned haptics off in settings
 *
 * Gesture-required platforms (Chrome on mobile, iOS 18.4+ PWAs) work fine
 * because every call site is inside a user-event handler (tap /
 * onCheckedChange).
 */

export type HapticType =
  | "selection" // subtle tick — toggles, selection changes, emoji pick
  | "impact" // single firm tap — task check, nudge button
  | "success"; // double tap "done" feel — confetti / day complete

// Short patterns only — long vibrations feel sluggish on Android and are
// ignored on iOS anyway. Add patterns back here when a call site needs
// them, not speculatively.
const PATTERNS: Record<HapticType, number | number[]> = {
  selection: 8,
  impact: 12,
  success: [14, 40, 22],
};

const PREF_STORAGE_KEY = "75proof_haptics_enabled";

let supportCache: boolean | null = null;
// Cached once per page load; setHapticsEnabled flips it so the settings
// toggle takes effect on the very next tap without a reload.
let enabledCache: boolean | null = null;

function isSupported(): boolean {
  if (supportCache !== null) return supportCache;
  if (typeof navigator === "undefined") {
    supportCache = false;
    return false;
  }
  supportCache = typeof navigator.vibrate === "function";
  return supportCache;
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Read the user's device-local haptics preference. Default: on. Stored in
 * localStorage because haptics are a per-device UX choice (users may want
 * buzz on their phone but not on a shared tablet) and don't need to roam
 * across installs.
 */
export function isHapticsEnabled(): boolean {
  if (enabledCache !== null) return enabledCache;
  if (typeof window === "undefined") return true;
  try {
    const raw = window.localStorage.getItem(PREF_STORAGE_KEY);
    enabledCache = raw !== "false";
    return enabledCache;
  } catch {
    return true;
  }
}

export function setHapticsEnabled(enabled: boolean): void {
  enabledCache = enabled;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PREF_STORAGE_KEY, enabled ? "true" : "false");
  } catch {
    // Storage quota / Safari private mode — we already updated the cache,
    // so the preference still applies for this session.
  }
}

export function haptic(type: HapticType = "selection"): void {
  if (!isSupported() || prefersReducedMotion()) return;
  if (!isHapticsEnabled()) return;
  try {
    navigator.vibrate(PATTERNS[type]);
  } catch {
    // Some browsers throw outside a user-gesture context; silently ignore.
  }
}
