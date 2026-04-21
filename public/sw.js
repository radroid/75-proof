/// <reference lib="webworker" />

// Bump this version string to force existing clients to drop old caches
// and re-fetch the latest precache manifest on activate.
const CACHE_NAME = "75proof-v2";
const OFFLINE_URL = "/offline";

// App shell assets to pre-cache on install. Everything here must be
// available at the listed URL at install time, or the whole install fails.
const PRECACHE_URLS = [
  OFFLINE_URL,
  "/manifest.webmanifest",
  "/icon-192.png",
  "/icon-512.png",
];

// Install: pre-cache offline page + core shell assets.
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      // Use individual adds so a single 404 doesn't abort the whole install
      // (e.g. if an icon is renamed later).
      await Promise.all(
        PRECACHE_URLS.map(async (url) => {
          try {
            // `reload` bypasses the HTTP cache so we always grab a fresh
            // copy of the offline page on SW update.
            await cache.add(new Request(url, { cache: "reload" }));
          } catch (err) {
            // eslint-disable-next-line no-console
            console.warn("[sw] precache failed for", url, err);
          }
        })
      );
      await self.skipWaiting();
    })()
  );
});

// Activate: drop caches from previous versions.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

// Fetch: route requests through caching strategies.
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip: non-GET requests.
  if (request.method !== "GET") return;

  // Skip: Convex WebSocket and API.
  if (url.hostname.includes("convex.cloud") || url.hostname.includes("convex.site")) return;

  // Skip: Clerk auth.
  if (url.hostname.includes("clerk")) return;

  // Skip: chrome-extension and other non-http(s) schemes.
  if (!url.protocol.startsWith("http")) return;

  // Cache-first: Next.js static assets (content-hashed, immutable).
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Cache-first: Google Fonts (stable URLs).
  if (
    url.hostname === "fonts.googleapis.com" ||
    url.hostname === "fonts.gstatic.com"
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Network-first: navigation requests (HTML pages) with offline fallback.
  // NOTE: We MUST always return a Response here — if the fallback cache
  // lookup misses, the browser would otherwise show its native offline page.
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);
          return response;
        } catch (_err) {
          const cache = await caches.open(CACHE_NAME);
          const offline = await cache.match(OFFLINE_URL);
          if (offline) return offline;
          // Last-resort: a minimal inline response so we never fall through
          // to the browser's native offline UI.
          return new Response(
            "<!doctype html><meta charset=utf-8><title>Offline</title><p>You're offline.</p>",
            {
              status: 503,
              statusText: "Service Unavailable",
              headers: { "Content-Type": "text/html; charset=utf-8" },
            }
          );
        }
      })()
    );
    return;
  }
});
