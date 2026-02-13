"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      process.env.NODE_ENV !== "production"
    ) {
      return;
    }

    navigator.serviceWorker.register("/sw.js").then((registration) => {
      // Check for updates every 60 minutes
      const interval = setInterval(
        () => registration.update(),
        60 * 60 * 1000
      );
      return () => clearInterval(interval);
    });
  }, []);

  return null;
}
