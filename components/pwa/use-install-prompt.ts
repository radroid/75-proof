"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

// Minimal shape of the non-standard `beforeinstallprompt` event that
// Chromium browsers fire when a PWA is installable. We intentionally keep
// this local so we don't leak a global type augmentation.
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const DISMISS_KEY = "75proof_install_prompt_dismissed_at";
const DISMISS_WINDOW_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Module-scope singleton that captures the one-shot `beforeinstallprompt`
 * event from Chromium. The listener is attached eagerly on first import on
 * the client so we don't miss the event when it fires on `/` or
 * `/onboarding` (before the dashboard layout — and the install prompt UI —
 * has mounted). Without this, local-mode users routinely never see the
 * install prompt: they pass through landing → onboarding → dashboard
 * quickly, Chrome fires the event before the gate is rendered, and it
 * never re-fires in the same session.
 *
 * `appinstalled` flips the captured event back to null so a stale event
 * after install doesn't leave the prompt actionable.
 */
type InstallEventStore = {
  event: BeforeInstallPromptEvent | null;
  installed: boolean;
};
// Replaced wholesale (never mutated in place) so `useSyncExternalStore`'s
// Object.is check sees a new snapshot identity on every change. Mutating
// the same object reference would silently skip re-renders and leave
// `canInstall` stuck even after Chrome fired `beforeinstallprompt`.
let installEventStore: InstallEventStore = { event: null, installed: false };
const installEventListeners = new Set<() => void>();
let installEventListenerAttached = false;

function notifyInstallEventChange() {
  for (const fn of installEventListeners) fn();
}

function attachInstallEventListener() {
  if (installEventListenerAttached) return;
  if (typeof window === "undefined") return;
  installEventListenerAttached = true;
  window.addEventListener("beforeinstallprompt", (event: Event) => {
    event.preventDefault();
    installEventStore = {
      ...installEventStore,
      event: event as BeforeInstallPromptEvent,
    };
    notifyInstallEventChange();
  });
  window.addEventListener("appinstalled", () => {
    installEventStore = { event: null, installed: true };
    notifyInstallEventChange();
  });
}

// Side effect on module load: attach as early as possible. Importing this
// module from the root layout via a tiny `<InstallPromptCapture />` is
// enough — see `components/pwa/install-prompt-capture.tsx`.
attachInstallEventListener();

function subscribeInstallEvent(fn: () => void): () => void {
  installEventListeners.add(fn);
  return () => {
    installEventListeners.delete(fn);
  };
}

function getInstallEventSnapshot(): InstallEventStore {
  return installEventStore;
}

const SERVER_INSTALL_EVENT_SNAPSHOT: InstallEventStore = {
  event: null,
  installed: false,
};
function getInstallEventServerSnapshot(): InstallEventStore {
  return SERVER_INSTALL_EVENT_SNAPSHOT;
}

function readDismissedAt(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DISMISS_KEY);
    if (!raw) return null;
    const ts = Date.parse(raw);
    return Number.isFinite(ts) ? ts : null;
  } catch {
    return null;
  }
}

function writeDismissedAt(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DISMISS_KEY, new Date().toISOString());
  } catch {
    // Ignore quota / private mode errors — worst case we re-prompt next visit.
  }
}

function isWithinDismissWindow(): boolean {
  const ts = readDismissedAt();
  if (ts === null) return false;
  return Date.now() - ts < DISMISS_WINDOW_MS;
}

function detectIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  // iPadOS 13+ reports as MacIntel; use maxTouchPoints as a tiebreaker.
  const isIPadOS =
    ua.includes("Macintosh") &&
    typeof navigator.maxTouchPoints === "number" &&
    navigator.maxTouchPoints > 1;
  return /iPhone|iPad|iPod/.test(ua) || isIPadOS;
}

function detectIOSSafari(): boolean {
  if (!detectIOS()) return false;
  const ua = navigator.userAgent || "";
  // Exclude in-app browsers and iOS Chrome/Firefox/Edge — none of which
  // support Add to Home Screen via Safari's share sheet.
  if (/CriOS|FxiOS|EdgiOS|OPiOS|GSA|FBAN|FBAV|Instagram|Line/i.test(ua)) {
    return false;
  }
  return /Safari/i.test(ua);
}

function detectStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const displayModeStandalone =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(display-mode: standalone)").matches;
  // iOS Safari exposes a non-standard `navigator.standalone` boolean.
  const iosStandalone =
    typeof navigator !== "undefined" &&
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return displayModeStandalone || iosStandalone;
}

export type UseInstallPromptResult = {
  canInstall: boolean;
  isIOS: boolean;
  isStandalone: boolean;
  promptInstall: () => Promise<void>;
  dismiss: () => void;
};

/**
 * Imperative entry point for the root-layout capture component. Calling
 * this is a no-op after the first call; it just makes the side effect's
 * intent obvious at the call site.
 */
export function ensureInstallPromptListener(): void {
  attachInstallEventListener();
}

export function useInstallPrompt(): UseInstallPromptResult {
  const installSnapshot = useSyncExternalStore(
    subscribeInstallEvent,
    getInstallEventSnapshot,
    getInstallEventServerSnapshot,
  );
  const deferredEvent = installSnapshot.event;
  const installedFromCapture = installSnapshot.installed;
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Detect environment once on mount. We avoid SSR divergence by gating on
  // `typeof window`.
  useEffect(() => {
    setIsIOS(detectIOSSafari());
    setIsStandalone(detectStandalone());
    setDismissed(isWithinDismissWindow());
  }, []);

  // The module-scope `appinstalled` listener flips a flag for us — mirror
  // it into local state so the dialog hides on completed install.
  useEffect(() => {
    if (installedFromCapture) setIsStandalone(true);
  }, [installedFromCapture]);

  // React to users toggling into standalone while the tab is open.
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }
    const mq = window.matchMedia("(display-mode: standalone)");
    const onChange = () => setIsStandalone(detectStandalone());
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    }
    // Safari < 14 fallback.
    mq.addListener(onChange);
    return () => mq.removeListener(onChange);
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredEvent) return;
    try {
      await deferredEvent.prompt();
      const choice = await deferredEvent.userChoice;
      // Record the decision regardless of outcome — Chrome won't re-fire the
      // event this session, and we don't want to nag on next load either.
      writeDismissedAt();
      setDismissed(true);
      installEventStore = { ...installEventStore, event: null };
      notifyInstallEventChange();
      if (choice.outcome === "accepted") {
        setIsStandalone(true);
      }
    } catch {
      // Swallow — user can re-trigger from settings later.
    }
  }, [deferredEvent]);

  const dismiss = useCallback(() => {
    writeDismissedAt();
    setDismissed(true);
  }, []);

  const canInstall =
    !isStandalone &&
    !dismissed &&
    (deferredEvent !== null || isIOS);

  return {
    canInstall,
    isIOS,
    isStandalone,
    promptInstall,
    dismiss,
  };
}
