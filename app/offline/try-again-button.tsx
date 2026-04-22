"use client";

import { useEffect, useState } from "react";

/**
 * "Try Again" button for the offline fallback page.
 *
 * The offline HTML is served from the service-worker cache, so a plain
 * `location.reload()` after reconnecting can land right back on the cached
 * offline page. To avoid that:
 *   1. We listen for `online` / `offline` events and reflect status in the
 *      button label so the user knows when connectivity is actually back.
 *   2. On click (or automatically the moment we regain connectivity) we
 *      `location.replace()` with a cache-busting query param. The SW's
 *      navigation handler is network-first — a fresh URL sidesteps any
 *      stale match in `caches.match`.
 */
export function TryAgainButton() {
  // Start pessimistic during SSR; hydrate to the real navigator.onLine on mount.
  const [online, setOnline] = useState(true);
  const [reloading, setReloading] = useState(false);

  useEffect(() => {
    if (typeof navigator === "undefined") return;
    setOnline(navigator.onLine);

    const handleOnline = () => {
      setOnline(true);
      // Auto-reload the moment the user reconnects — saves them a tap.
      setReloading(true);
      reloadWithBust();
    };
    const handleOffline = () => setOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const onClick = () => {
    setReloading(true);
    reloadWithBust();
  };

  const disabled = !online || reloading;
  const label = reloading
    ? "Back online — reloading..."
    : online
      ? "Reload"
      : "Try Again";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        minHeight: 48,
        minWidth: 44,
        padding: "12px 32px",
        backgroundColor: disabled ? "#999999" : "#FF6154",
        color: "#ffffff",
        border: "none",
        borderRadius: 0,
        fontSize: 16,
        fontWeight: 700,
        cursor: disabled ? "not-allowed" : "pointer",
        letterSpacing: "0.01em",
        touchAction: "manipulation",
        WebkitTapHighlightColor: "transparent",
        opacity: disabled && !reloading ? 0.7 : 1,
      }}
    >
      {label}
    </button>
  );
}

/**
 * Leave the offline page by navigating somewhere meaningful (the dashboard
 * by default) with a cache-busting query param.
 *
 * Reloading `/offline` itself just re-renders the offline route, which is
 * pointless once connectivity returns — we want to bounce the user back to
 * real content. The SW's navigation handler is network-first, so a fresh
 * URL (`?_t=...`) cleanly defeats any stale cache match.
 *
 * `replace` avoids polluting history with the `/offline` entry.
 */
function reloadWithBust() {
  if (typeof window === "undefined") return;
  // Prefer "/" over "/offline" — the offline route only exists as a fallback
  // shown to the user; when they're back online they shouldn't stay on it.
  const path =
    window.location.pathname === "/offline"
      ? "/"
      : window.location.pathname;
  const target = path + "?_t=" + Date.now();
  window.location.replace(target);
}
