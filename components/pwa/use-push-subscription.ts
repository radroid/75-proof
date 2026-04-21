"use client";

import { useCallback, useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export type PushPermissionStatus =
  | "unsupported"
  | "denied"
  | "granted"
  | "default"
  | "loading";

export type UsePushSubscriptionResult = {
  status: PushPermissionStatus;
  isSubscribed: boolean;
  /** iOS-only: if true, user must install the PWA before notifications work. */
  requiresInstall: boolean;
  /** True if the VAPID public key env var is missing (misconfiguration). */
  missingVapidKey: boolean;
  requestPermission: () => Promise<{ granted: boolean }>;
  unsubscribe: () => Promise<void>;
};

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

// Convert the url-safe base64 VAPID public key into the Uint8Array
// `pushManager.subscribe` expects as `applicationServerKey`.
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = typeof atob === "function" ? atob(base64) : "";
  // Allocate via ArrayBuffer explicitly so TypeScript narrows to
  // Uint8Array<ArrayBuffer>, which is what BufferSource expects.
  const buffer = new ArrayBuffer(rawData.length);
  const output = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; ++i) {
    output[i] = rawData.charCodeAt(i);
  }
  return output;
}

function detectIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const isIPadOS =
    ua.includes("Macintosh") &&
    typeof navigator.maxTouchPoints === "number" &&
    navigator.maxTouchPoints > 1;
  return /iPhone|iPad|iPod/.test(ua) || isIPadOS;
}

function detectStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const displayModeStandalone =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(display-mode: standalone)").matches;
  const iosStandalone =
    typeof navigator !== "undefined" &&
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return displayModeStandalone || iosStandalone;
}

function detectPlatform(): "ios" | "android" | "desktop" {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent || "";
  if (detectIOS()) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "desktop";
}

/**
 * `navigator.serviceWorker.ready` never resolves if no SW is registered for
 * this scope (e.g. the registration host allowlist excluded the current
 * origin). Wrap it in a timeout so the Enable flow can't hang forever — we
 * surface a clear error instead.
 */
function swReadyWithTimeout(ms: number): Promise<ServiceWorkerRegistration> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(
        new Error(
          `Service worker never became ready within ${ms}ms. Is /sw.js registered on this host?`
        )
      );
    }, ms);
    navigator.serviceWorker.ready
      .then((reg) => {
        clearTimeout(timeoutId);
        resolve(reg);
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        reject(err);
      });
  });
}

function getSubscriptionKeys(
  sub: PushSubscription
): { auth: string; p256dh: string } | null {
  const authBuf = sub.getKey("auth");
  const p256dhBuf = sub.getKey("p256dh");
  if (!authBuf || !p256dhBuf) return null;

  const toBase64 = (buf: ArrayBuffer) => {
    const bytes = new Uint8Array(buf);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    // url-safe base64 (no padding) — matches what web-push expects.
    return btoa(binary)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  };

  return {
    auth: toBase64(authBuf),
    p256dh: toBase64(p256dhBuf),
  };
}

export function usePushSubscription(): UsePushSubscriptionResult {
  const [status, setStatus] = useState<PushPermissionStatus>("loading");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [requiresInstall, setRequiresInstall] = useState(false);

  const upsertSubscription = useMutation(
    api.pushSubscriptions.upsertSubscription
  );
  const removeSubscription = useMutation(
    api.pushSubscriptions.removeSubscription
  );
  const mySubs = useQuery(api.pushSubscriptions.listMySubscriptions);

  // Initial capability + permission detection.
  useEffect(() => {
    if (typeof window === "undefined") {
      setStatus("unsupported");
      return;
    }

    const hasSW = "serviceWorker" in navigator;
    const hasPush = "PushManager" in window;
    const hasNotification = "Notification" in window;

    if (!hasSW || !hasPush || !hasNotification) {
      setStatus("unsupported");
      return;
    }

    // iOS: Web Push works only in installed PWAs (iOS 16.4+).
    if (detectIOS() && !detectStandalone()) {
      setStatus("unsupported");
      setRequiresInstall(true);
      return;
    }

    const current = Notification.permission;
    if (current === "granted") setStatus("granted");
    else if (current === "denied") setStatus("denied");
    else setStatus("default");

    // Check for existing push subscription — user may already be subscribed
    // on this device from a prior session.
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => {
        setIsSubscribed(Boolean(sub));
      })
      .catch(() => {
        // Silent — getSubscription can throw on partial SW registration.
      });
  }, []);

  // Re-sync `isSubscribed` with server state once we have it. This covers the
  // case where a user subscribed on another device — the hook reflects that.
  useEffect(() => {
    if (!mySubs) return;
    // Only treat as subscribed for this device if we found a local sub above.
    // Server list is informational; we don't flip `isSubscribed` based on it.
  }, [mySubs]);

  // Listen for SW-initiated resubscribe (pushsubscriptionchange) and persist.
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }
    const handler = async (event: MessageEvent) => {
      const data = event.data as
        | {
            type?: string;
            subscription?: {
              endpoint: string;
              keys: { auth: string; p256dh: string };
            };
            oldEndpoint?: string | null;
          }
        | undefined;
      if (!data || data.type !== "pushsubscriptionchange") return;
      try {
        if (data.oldEndpoint) {
          await removeSubscription({ endpoint: data.oldEndpoint }).catch(
            () => undefined
          );
        }
        if (data.subscription) {
          await upsertSubscription({
            endpoint: data.subscription.endpoint,
            keys: data.subscription.keys,
            userAgent:
              typeof navigator !== "undefined" ? navigator.userAgent : undefined,
            platform: detectPlatform(),
            enabled: true,
          });
        }
      } catch {
        // Non-fatal — user can re-subscribe next session.
      }
    };
    navigator.serviceWorker.addEventListener("message", handler);
    return () => {
      navigator.serviceWorker.removeEventListener("message", handler);
    };
  }, [removeSubscription, upsertSubscription]);

  const requestPermission = useCallback(async (): Promise<{
    granted: boolean;
  }> => {
    // Wrap the whole flow in try/finally so callers' `loading` state always
    // clears — any throw anywhere still resolves, never hangs.
    try {
      if (typeof window === "undefined") return { granted: false };
      if (status === "unsupported") {
        // eslint-disable-next-line no-console
        console.warn("[push] skipped — environment is unsupported");
        return { granted: false };
      }
      if (!VAPID_PUBLIC_KEY) {
        // eslint-disable-next-line no-console
        console.warn(
          "[push] NEXT_PUBLIC_VAPID_PUBLIC_KEY is not set — cannot subscribe."
        );
        return { granted: false };
      }
      // iOS Safari (non-standalone) will happily return "granted" for
      // Notification.requestPermission but pushManager.subscribe never
      // resolves — bail *before* we block on it and leave the UI stuck.
      if (detectIOS() && !detectStandalone()) {
        // eslint-disable-next-line no-console
        console.warn(
          "[push] iOS Safari tab — install to Home Screen before enabling push"
        );
        setStatus("unsupported");
        setRequiresInstall(true);
        return { granted: false };
      }

      let permission: NotificationPermission;
      try {
        permission = await Notification.requestPermission();
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn("[push] requestPermission threw, falling back", err);
        permission = Notification.permission;
      }

      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "default");
        return { granted: false };
      }
      setStatus("granted");

      try {
        // 8s is generous for local SW startup but short enough that a
        // misconfigured host surfaces the error instead of hanging the UI.
        const reg = await swReadyWithTimeout(8000);
        let sub = await reg.pushManager.getSubscription();
        if (!sub) {
          sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
          });
        }
        const keys = getSubscriptionKeys(sub);
        if (!keys) {
          // eslint-disable-next-line no-console
          console.warn("[push] subscription missing auth/p256dh keys");
          return { granted: true };
        }
        await upsertSubscription({
          endpoint: sub.endpoint,
          keys,
          userAgent:
            typeof navigator !== "undefined" ? navigator.userAgent : undefined,
          platform: detectPlatform(),
          enabled: true,
        });
        // Force a re-check so `isSubscribed` reflects the freshly-persisted
        // server state even if the local `setIsSubscribed(true)` below races
        // another effect.
        setIsSubscribed(true);
        return { granted: true };
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("[push] subscribe failed", err);
        return { granted: true };
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[push] requestPermission unexpected failure", err);
      return { granted: false };
    }
  }, [status, upsertSubscription]);

  const unsubscribe = useCallback(async (): Promise<void> => {
    if (typeof window === "undefined") return;
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        const endpoint = sub.endpoint;
        await sub.unsubscribe().catch(() => undefined);
        await removeSubscription({ endpoint }).catch(() => undefined);
      }
      setIsSubscribed(false);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[push] unsubscribe failed", err);
    }
  }, [removeSubscription]);

  return {
    status,
    isSubscribed,
    requiresInstall,
    missingVapidKey: !VAPID_PUBLIC_KEY,
    requestPermission,
    unsubscribe,
  };
}
