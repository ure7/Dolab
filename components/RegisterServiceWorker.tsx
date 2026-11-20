"use client";

import { useEffect } from "react";

// Turns on public/sw.js (installable app + offline page). Production only:
// during `next dev` a service worker would get in the way of live reloading.
export function RegisterServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {
      // Not supported / blocked: the app works the same, just not offline.
    });
  }, []);
  return null;
}
