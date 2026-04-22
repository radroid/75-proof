"use client";

import { useCallback, useEffect, useState } from "react";

// Minimal shape of the non-standard `beforeinstallprompt` event that
// Chromium browsers fire when a PWA is installable. We intentionally keep
// this local so we don't leak a global type augmentation.
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const DISMISS_KEY = "75proof_install_prompt_dismissed_at";
const DISMISS_WINDOW_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

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

export function useInstallPrompt(): UseInstallPromptResult {
  const [deferredEvent, setDeferredEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
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

  // Listen for Android/Chromium install hint.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handler = (event: Event) => {
      event.preventDefault();
      setDeferredEvent(event as BeforeInstallPromptEvent);
    };
    const installedHandler = () => {
      setDeferredEvent(null);
      setIsStandalone(true);
    };

    window.addEventListener("beforeinstallprompt", handler as EventListener);
    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handler as EventListener
      );
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

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
      setDeferredEvent(null);
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
