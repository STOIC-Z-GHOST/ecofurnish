"use client";

import { RESTOCK_AFTER_HOURS } from "@/lib/restock-config";

const STORAGE_KEY = "ecofurnish-simulated-purchases";

/**
 * How long a browser's own demo "purchases" keep reducing the stock it sees.
 * After this many hours the product goes back to its normal stock for that
 * browser. Set to 12 for a twice-a-day reset.
 */
export const DEMO_STOCK_RESET_HOURS = 24;
const RESET_MS = DEMO_STOCK_RESET_HOURS * 60 * 60 * 1000;

// Once a visitor has bought a product's LAST unit, it refills this long
// after that moment (see RESTOCK_AFTER_HOURS in lib/restock-config.ts) —
// counted from when it sold out for them, not from their first purchase.
const SOLD_OUT_MS = RESTOCK_AFTER_HOURS * 60 * 60 * 1000;

// q = how many this browser has "bought"; t = when the first of them was
// bought; o = when the last unit was bought (it "sold out" for this browser),
// if that has happened. Before it sells out, a tally is forgotten
// DEMO_STOCK_RESET_HOURS after t; once it has sold out, SOLD_OUT_MS after o.
type Tally = { q: number; t: number; o?: number };
type State = { v: 2; items: Record<string, Tally>; orders: Record<string, number> };

function emptyState(): State {
  return { v: 2, items: {}, orders: {} };
}

// Anything older than the reset window is dropped on read, which is the
// whole "reset" — nothing has to run on a timer. Data in any other shape
// (the old plain {productId: count} format, or junk) is ignored, which also
// just means a clean slate.
function readState(now = Date.now()): State {
  if (typeof window === "undefined") return emptyState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.v !== 2 || typeof parsed.items !== "object" || typeof parsed.orders !== "object") {
      return emptyState();
    }
    const state = emptyState();
    for (const [id, tally] of Object.entries(parsed.items as Record<string, Tally>)) {
      const age = now - tally?.t;
      if (!Number.isFinite(tally?.q) || !Number.isFinite(age) || age < 0) continue;
      const soldOut = Number.isFinite(tally.o);
      const expiresAt = soldOut ? (tally.o as number) + SOLD_OUT_MS : tally.t + RESET_MS;
      if (now < expiresAt) {
        state.items[id] = soldOut ? { q: tally.q, t: tally.t, o: tally.o } : { q: tally.q, t: tally.t };
      }
    }
    for (const [orderId, t] of Object.entries(parsed.orders as Record<string, number>)) {
      const age = now - t;
      if (Number.isFinite(age) && age >= 0 && age < RESET_MS) state.orders[orderId] = t;
    }
    return state;
  } catch {
    return emptyState();
  }
}

/**
 * The stock number THIS browser should see for a product — the real,
 * admin-set stock minus whatever this browser has itself "bought" in the
 * last DEMO_STOCK_RESET_HOURS. Real stock is not lowered by checkout (see
 * confirmPayment in app/actions/orders.ts), so every other visitor keeps
 * seeing the full number; only this browser's own tally makes it differ here.
 * Returns realStock unchanged during SSR (no localStorage yet) — callers
 * that render this should follow the useSyncExternalStore pattern in
 * useEffectiveStock to avoid a hydration mismatch.
 */
export function getSimulatedStock(productId: string, realStock: number): number {
  const tally = readState().items[productId];
  return Math.max(0, realStock - (tally?.q ?? 0));
}

/**
 * When this browser's own "bought it" tally for a product runs out and the
 * product goes back to its normal stock — as a timestamp in ms, or null if
 * this browser hasn't bought any (or it has already reset). Used for the
 * "Back in stock in …" countdown on a product that's sold out for THIS
 * browser only.
 */
export function getSimulatedRestockAt(productId: string): number | null {
  const tally = readState().items[productId];
  if (!tally) return null;
  return tally.o !== undefined ? tally.o + SOLD_OUT_MS : tally.t + RESET_MS;
}

/**
 * Called once, client-side, right after a real order is confirmed paid —
 * records what THIS browser just "bought" so its own view of stock reflects
 * it for the next DEMO_STOCK_RESET_HOURS, without touching the real shared
 * number. See RecordSimulatedPurchase (components/RecordSimulatedPurchase.tsx).
 *
 * orderId makes this safe to call more than once for the same order:
 * refreshing or revisiting the confirmation page used to count the same
 * purchase again each time. purchasedAt (ms) is when the order was placed —
 * a purchase that's already older than the reset window has nothing left to
 * count, so it's skipped.
 */
export function recordSimulatedPurchase(
  // stock = the product's real stock, when known — it's how this works out
  // that THIS purchase took the last unit, which starts the refill clock.
  items: { productId: string; quantity: number; stock?: number }[],
  orderId?: string,
  purchasedAt: number = Date.now()
) {
  if (typeof window === "undefined") return;
  const now = Date.now();
  if (now - purchasedAt >= RESET_MS) return;

  const state = readState(now);
  if (orderId) {
    if (state.orders[orderId]) return; // already counted
    state.orders[orderId] = purchasedAt;
  }
  for (const item of items) {
    const current = state.items[item.productId];
    const q = (current?.q ?? 0) + item.quantity;
    const soldOutAt =
      current?.o ?? (typeof item.stock === "number" && q >= item.stock ? purchasedAt : undefined);
    state.items[item.productId] = {
      q,
      t: Math.min(current?.t ?? purchasedAt, purchasedAt),
      ...(soldOutAt !== undefined ? { o: soldOutAt } : {}),
    };
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage unavailable (private browsing, quota, etc.) — fine,
    // this is a cosmetic layer; the real checkout flow is unaffected.
  }
}
