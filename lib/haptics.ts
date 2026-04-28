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
  | "success" // double tap "done" feel — task / day complete
  | "celebration"; // sustained roll — confetti / streak milestone

// Android / web-standard patterns. iOS doesn't use these — it gets the
// native UISwitch haptic via the checkbox trick and additional taps for
// the multi-beat types to approximate longer feedback.
const PATTERNS: Record<HapticType, number | number[]> = {
  selection: 8,
  impact: 12,
  success: [14, 40, 22],
  // Smooth ~480ms roll: a single long buzz so confetti doesn't feel like
  // a punctuated tap. iOS approximates this by firing the UISwitch tap
  // several times in rapid succession (see fireIOSHaptic).
  celebration: 480,
};

// iOS approximation for `celebration`: the UISwitch haptic is a fixed
// brief tap, so to simulate a sustained roll we fire 6 taps spaced
// ~70ms apart. The whole sequence stays inside the trusted-event window
// of the originating user gesture.
const IOS_CELEBRATION_TAPS = 6;
const IOS_CELEBRATION_INTERVAL_MS = 70;

const PREF_STORAGE_KEY = "75proof_haptics_enabled";
// Separate from the on/off preference: this tracks whether we've shown the
// one-time iOS prompt yet, so users who explicitly toggle off in Settings
// don't get re-prompted, and users who've been asked don't get nagged.
const PROMPT_STORAGE_KEY = "75proof_haptics_prompt_shown";

let vibrateSupportCache: boolean | null = null;
let iosCache: boolean | null = null;
let enabledCache: boolean | null = null;
let iosSwitchEl: HTMLLabelElement | null = null;

/**
 * Public iOS detector. Mirrors the existing private `isIOS()` so callers
 * outside this module (the permission prompt component) don't need to
 * duplicate the iPadOS-as-Macintosh tiebreaker.
 */
export function isIOSDevice(): boolean {
  return isIOS();
}

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
 * Lazily create (and keep alive) one hidden `<label>` wrapping a
 * `<input type="checkbox" switch>` so we can programmatically click the
 * label to fire iOS's native UISwitch haptic.
 *
 * Important: WebKit only emits the haptic when the *label* receives a
 * synthetic click — clicking the input directly is a no-op (see Ionic
 * issue #29942 and the canonical tijnjh/ios-haptics implementation).
 * Kept as a singleton because mount/unmount on every call added
 * noticeable overhead in testing.
 */
function getIOSSwitchEl(): HTMLLabelElement | null {
  if (typeof document === "undefined" || !document.body) return null;
  if (iosSwitchEl && iosSwitchEl.isConnected) return iosSwitchEl;
  const label = document.createElement("label");
  label.setAttribute("aria-hidden", "true");
  label.style.display = "none";
  const input = document.createElement("input");
  input.type = "checkbox";
  // iOS 17.4+ interprets this attribute as the UISwitch control with
  // native haptic feedback on toggle. No-op on other platforms.
  input.setAttribute("switch", "");
  input.tabIndex = -1;
  label.appendChild(input);
  document.body.appendChild(label);
  iosSwitchEl = label;
  return label;
}

function fireIOSHaptic(type: HapticType): void {
  const label = getIOSSwitchEl();
  if (!label) return;
  try {
    // Click the LABEL — not the input. WebKit only emits the UISwitch
    // haptic for label-mediated clicks (see comment on getIOSSwitchEl).
    label.click();
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
    } else if (type === "celebration") {
      // Sustained roll for confetti: fire additional UISwitch taps in
      // rapid succession so the user feels a continuous buzz rather
      // than one isolated tap. The first tap already fired above, so
      // schedule the remaining N-1.
      for (let i = 1; i < IOS_CELEBRATION_TAPS; i++) {
        window.setTimeout(() => {
          if (iosSwitchEl && iosSwitchEl.isConnected) {
            try {
              iosSwitchEl.click();
            } catch {
              // ignored
            }
          }
        }, i * IOS_CELEBRATION_INTERVAL_MS);
      }
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

/**
 * Has the user already seen the iOS one-time haptics prompt? Used by the
 * prompt gate so we don't show it twice on the same device.
 */
export function hasBeenPromptedForHaptics(): boolean {
  if (typeof window === "undefined") return true; // SSR: don't show
  try {
    return window.localStorage.getItem(PROMPT_STORAGE_KEY) === "true";
  } catch {
    // Storage blocked — treat as already-prompted so we don't keep nagging
    // a user whose decision we can't persist anyway.
    return true;
  }
}

export function markHapticsPrompted(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PROMPT_STORAGE_KEY, "true");
  } catch {
    // ignored — see read path
  }
}

// Dev-only trace so we can see from Web Inspector on an iPhone which
// branch actually ran (and why nothing fired). Stripped out of prod
// bundles by Next.js's NODE_ENV-gated dead-code elimination.
const DEV = process.env.NODE_ENV !== "production";
function trace(msg: string, extra?: Record<string, unknown>): void {
  if (!DEV) return;
  // eslint-disable-next-line no-console
  console.log(`[haptic] ${msg}`, extra ?? "");
}

export function haptic(type: HapticType = "selection"): void {
  if (prefersReducedMotion()) {
    trace("skip: prefers-reduced-motion", { type });
    return;
  }
  if (!isHapticsEnabled()) {
    trace("skip: disabled in settings", { type });
    return;
  }

  if (isIOS()) {
    trace("iOS path: UISwitch trick", { type });
    fireIOSHaptic(type);
    return;
  }

  if (!hasVibrate()) {
    trace("skip: no navigator.vibrate support", { type });
    return;
  }
  try {
    navigator.vibrate(PATTERNS[type]);
    trace("vibrate() fired", { type, pattern: PATTERNS[type] });
  } catch (err) {
    trace("vibrate() threw", { err });
  }
}
