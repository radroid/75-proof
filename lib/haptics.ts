"use client";

/**
 * Lightweight haptic feedback via `navigator.vibrate`.
 *
 * No-ops on:
 *  - SSR (no navigator)
 *  - Browsers without the Vibration API (desktop Safari, iOS Safari pre-18,
 *    some Firefox builds)
 *  - Users who prefer reduced motion
 *
 * Gesture-required platforms (Chrome on mobile) work fine because every
 * call site is inside a user-event handler (tap / onCheckedChange).
 */

export type HapticType =
  | "selection" // subtle tick — toggles, selection changes
  | "impact" // single firm tap — task check, button press
  | "success" // double tap "done" feel — habit complete
  | "warning" // heavier double — reset / destructive confirm
  | "error"; // longer trio — failed action

// Short patterns only — long vibrations feel sluggish on Android and are
// ignored on iOS anyway.
const PATTERNS: Record<HapticType, number | number[]> = {
  selection: 8,
  impact: 12,
  success: [14, 40, 22],
  warning: [24, 40, 24],
  error: [40, 40, 40, 40, 40],
};

let supportCache: boolean | null = null;

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

export function haptic(type: HapticType = "selection"): void {
  if (!isSupported() || prefersReducedMotion()) return;
  try {
    navigator.vibrate(PATTERNS[type]);
  } catch {
    // Some browsers throw outside a user-gesture context; silently ignore.
  }
}
