"use client";

// Helpers for the rare case where a visitor's browser holds old copies of the
// site (saved pages, scripts) that no longer match what is deployed.

/** Deletes this site's saved copies and the service worker, on this device. */
export async function purgeSiteCaches() {
  try {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k.startsWith("ecofurnish-")).map((k) => caches.delete(k)));
    }
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((r) => r.unregister()));
    }
  } catch {
    // Best effort: nothing here should ever throw at a visitor.
  }
}

/**
 * Called from an error screen. The first time in a browser tab it clears the
 * saved copies and reloads, which fixes "works in a private window, breaks in
 * a normal one" by itself. It only ever does this once per tab, so a genuine
 * error can't cause a reload loop. Returns true when it started a reload.
 */
export function recoverFromStaleCache(): boolean {
  try {
    if (sessionStorage.getItem("eco-cache-reset")) return false;
    sessionStorage.setItem("eco-cache-reset", "1");
  } catch {
    return false;
  }
  purgeSiteCaches().finally(() => window.location.reload());
  return true;
}
