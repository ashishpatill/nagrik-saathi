"use client";

import { useEffect } from "react";

/**
 * Register only in production. A service worker in `next dev` would serve a
 * stale cache across every edit; the offline path is verified against a real
 * production build instead.
 */
export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .catch(() => {
        // Installation is an enhancement. The app must work without it.
      });
  }, []);

  return null;
}
