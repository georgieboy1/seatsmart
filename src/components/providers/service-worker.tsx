"use client";

import { useEffect } from "react";

/** Registers /sw.js in production so SynDesk keeps working offline. */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Offline support is a bonus; the app works without it.
    });
  }, []);
  return null;
}
