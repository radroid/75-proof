"use client";

import { useEffect } from "react";

// Hostnames where we allow the service worker to register.
// We intentionally exclude Vercel preview/ephemeral hosts to avoid stale
// caches following users across deploys.
const ALLOWED_SW_HOSTS = new Set<string>([
  "localhost",
  "127.0.0.1",
  "75proof.app",
  "www.75proof.app",
]);

function isAllowedHost(hostname: string): boolean {
  if (ALLOWED_SW_HOSTS.has(hostname)) return true;
  // Allow LAN testing (e.g. http://192.168.x.x) in dev.
  if (/^192\.168\.\d+\.\d+$/.test(hostname)) return true;
  if (/^10\.\d+\.\d+\.\d+$/.test(hostname)) return true;
  return false;
}

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const { hostname } = window.location;
    if (!isAllowedHost(hostname)) {
      // Skip on preview/ephemeral hosts (e.g. *.vercel.app) to avoid stale
      // caches bleeding across deploys.
      return;
    }

    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.warn(
        "[sw] Service worker active in dev — cached requests may feel stale. " +
          "Unregister via DevTools > Application > Service Workers if needed."
      );
    }

    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | undefined;

    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        if (cancelled) return;
        // Check for updates every 60 minutes.
        interval = setInterval(
          () => registration.update(),
          60 * 60 * 1000
        );
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.warn("[sw] registration failed", err);
      });

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
    };
  }, []);

  return null;
}
