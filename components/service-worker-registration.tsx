"use client";

import { useEffect } from "react";

/**
 * We used to maintain a hostname allowlist to avoid stale caches "following
 * users across deploys." That concern is misplaced — service workers are
 * strictly scoped to their origin, so a preview at `abc.vercel.app` cannot
 * intercept a request to `prod.example.com`. Cross-deploy staleness *on the
 * same origin* is already handled by the CACHE_NAME version bump in sw.js,
 * which runs in the `activate` handler and deletes old caches.
 *
 * Register on any HTTPS origin (or localhost) so ngrok tunnels, Vercel
 * previews, staging domains, and production all just work.
 */
function isSWEligible(hostname: string, protocol: string): boolean {
  if (hostname === "localhost" || hostname === "127.0.0.1") return true;
  // HTTPS is required by browsers for SW registration; enforce it here so
  // we surface a clear skip in dev if the tunnel isn't HTTPS.
  return protocol === "https:";
}

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const { hostname, protocol } = window.location;
    if (!isSWEligible(hostname, protocol)) {
      // eslint-disable-next-line no-console
      console.warn(
        `[sw] skipped registration for ${protocol}//${hostname} — HTTPS (or localhost) required.`
      );
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
