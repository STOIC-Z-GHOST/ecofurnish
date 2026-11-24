"use client";

import { useMemo, useSyncExternalStore } from "react";
import { getSimulatedStock } from "@/lib/simulated-stock";

// Subscribers to "the stock this browser should see may have changed".
// Two things can change it while a page is open now: another tab recording
// a purchase (the "storage" event), and time itself — a browser's temporary
// "bought it" tally expires after DEMO_STOCK_RESET_HOURS (see
// lib/simulated-stock.ts), at which point the product returns to normal
// stock with nothing else happening. useSyncExternalStore only re-renders
// a component when the NUMBER it gets back actually changes, so the cheap
// periodic nudge below costs nothing while the stock is steady.
const listeners = new Set<() => void>();
let nudgeTimer: ReturnType<typeof setInterval> | null = null;

/** Ask every stock display on the page to re-check right now. */
export function notifyStockChanged() {
  listeners.forEach((listener) => listener());
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  if (listeners.size === 1) {
    nudgeTimer = setInterval(notifyStockChanged, 10_000);
    window.addEventListener("storage", notifyStockChanged);
  }
  return () => {
    listeners.delete(onChange);
    if (listeners.size === 0) {
      if (nudgeTimer) clearInterval(nudgeTimer);
      nudgeTimer = null;
      window.removeEventListener("storage", notifyStockChanged);
    }
  };
}

/**
 * Returns the stock number to actually display for a product.
 * useSyncExternalStore is the right tool here specifically because its
 * getServerSnapshot argument lets the SSR render match the client's
 * first paint exactly (both return rawStock), then cleanly swap to the
 * localStorage-adjusted value after hydration — without the cascading-
 * render risk of calling setState inside a useEffect.
 */
export function useEffectiveStock(productId: string, rawStock: number): number {
  return useSyncExternalStore(
    subscribe,
    () => getSimulatedStock(productId, rawStock),
    () => rawStock
  );
}

/**
 * Same as useEffectiveStock, for several ids at once (a product's colors and
 * sizes). A hook can't be called in a loop, so this reads them all through one
 * subscription. Returns { id: stock to show }.
 */
export function useEffectiveStocks(entries: { id: string; stock: number }[]): Record<string, number> {
  const rawSnapshot = entries.map((e) => e.stock).join(",");
  const snapshot = useSyncExternalStore(
    subscribe,
    () => entries.map((e) => getSimulatedStock(e.id, e.stock)).join(","),
    () => rawSnapshot
  );
  return useMemo(() => {
    const numbers = snapshot.split(",");
    const out: Record<string, number> = {};
    entries.forEach((e, i) => {
      const n = Number(numbers[i]);
      out[e.id] = Number.isFinite(n) ? n : e.stock;
    });
    return out;
    // `entries` is rebuilt by the caller each render; its content is what the
    // snapshot string already captures.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot]);
}
