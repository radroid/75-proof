"use client";

/**
 * Haptic feedback, per-platform.
 *
 * Android / Chrome / Firefox: `navigator.vibrate()` with tuned patterns.
 *
 * iOS Safari (and iOS PWAs): `navigator.vibrate()` is only partially
 * implemented in iOS 18.4+, gated on a 1s trusted-event window, and
 * silently refuses in many installed-PWA contexts. The *reliable* path
 * is `<input type="checkbox" switch />` — iOS 17.4+ renders it as a
 * UISwitch and fires a native system haptic when toggled. We create a
 * hidden one and programmatically `.click()` it from user-event
 * handlers. Same trick Ionic and tijnjh/ios-haptics use.
 *
 * No-ops on:
 *  - SSR (no window)
 *  - Users who prefer reduced motion
 *  - Users who've turned haptics off in settings
 *  - Devices with neither Vibration API nor switch-input haptics
 *  - iPhones in Silent mode with "Play Haptics in Silent Mode" off
 *    (there's no way to override the system setting from JS)
 */

export type HapticType =
  | "selection" // subtle tick — toggles, selection changes, emoji pick
  | "impact" // single firm tap — task check, nudge button
  | "success"; // double tap "done" feel — confetti / day complete

// Android / web-standard patterns. iOS doesn't use these — it gets the
// native UISwitch haptic via the checkbox trick and a second tap for
// "success" to approximate the double-beat.
const PATTERNS: Record<HapticType, number | number[]> = {
  selection: 8,
  impact: 12,
  success: [14, 40, 22],
};

const PREF_STORAGE_KEY = "75proof_haptics_enabled";

let vibrateSupportCache: boolean | null = null;
let iosCache: boolean | null = null;
let enabledCache: boolean | null = null;
let iosSwitchEl: HTMLInputElement | null = null;

function isIOS(): boolean {
  if (iosCache !== null) return iosCache;
  if (typeof navigator === "undefined") {
    iosCache = false;
    return false;
  }
  const ua = navigator.userAgent || "";
  // iPadOS reports as Mac but exposes multi-touch — catch both.
  const isIPadOS =
    ua.includes("Macintosh") &&
    typeof navigator.maxTouchPoints === "number" &&
    navigator.maxTouchPoints > 1;
  iosCache = /iPhone|iPad|iPod/.test(ua) || isIPadOS;
  return iosCache;
}

function hasVibrate(): boolean {
  if (vibrateSupportCache !== null) return vibrateSupportCache;
  if (typeof navigator === "undefined") {
    vibrateSupportCache = false;
    return false;
  }
  vibrateSupportCache = typeof navigator.vibrate === "function";
  return vibrateSupportCache;
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Lazily create (and keep alive) one hidden `<input type="checkbox" switch>`
 * element we can programmatically click to fire iOS's native UISwitch
 * haptic. Kept as a singleton because mount/unmount on every call added
 * noticeable overhead in testing and is unnecessary.
 */
function getIOSSwitchEl(): HTMLInputElement | null {
  if (typeof document === "undefined" || !document.body) return null;
  if (iosSwitchEl && iosSwitchEl.isConnected) return iosSwitchEl;
  const el = document.createElement("input");
  el.type = "checkbox";
  // iOS 17.4+ interprets this attribute as the UISwitch control with
  // native haptic feedback on toggle. No-op on other platforms.
  el.setAttribute("switch", "");
  // Offscreen but still in the accessibility tree as hidden. Don't use
  // display:none — in some WebKit builds that suppresses the haptic.
  el.setAttribute("aria-hidden", "true");
  el.tabIndex = -1;
  el.style.position = "fixed";
  el.style.left = "-9999px";
  el.style.top = "0";
  el.style.width = "1px";
  el.style.height = "1px";
  el.style.opacity = "0";
  el.style.pointerEvents = "none";
  document.body.appendChild(el);
  iosSwitchEl = el;
  return el;
}

function fireIOSHaptic(type: HapticType): void {
  const el = getIOSSwitchEl();
  if (!el) return;
  try {
    el.click();
    if (type === "success") {
      // Second tap ~70ms later for a "done" double-beat. Stays inside
      // the original click's trusted-event window.
      window.setTimeout(() => {
        if (iosSwitchEl && iosSwitchEl.isConnected) {
          try {
            iosSwitchEl.click();
          } catch {
            // ignored
          }
        }
      }, 70);
    }
  } catch {
    // ignored — silent no-op is the correct fallback for haptics.
  }
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
  if (prefersReducedMotion() || !isHapticsEnabled()) return;

  if (isIOS()) {
    // iOS: prefer the UISwitch trick. Fall through to vibrate() as a
    // belt-and-suspenders for devices where it happens to work.
    fireIOSHaptic(type);
    return;
  }

  if (!hasVibrate()) return;
  try {
    navigator.vibrate(PATTERNS[type]);
  } catch {
    // Some browsers throw outside a user-gesture context; silently ignore.
  }
}
