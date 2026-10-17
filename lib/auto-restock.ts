import { and, isNull, lte } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { RESTOCK_AFTER_HOURS, RESTOCK_QUANTITY } from "@/lib/restock-config";

// Looking is cheap, but there's no reason to do it on every single page
// render. This is per server instance (each warm serverless instance keeps
// its own), which is fine: the updates below are safe to run from several
// places at once, so the worst case is a few redundant no-op checks.
const CHECK_EVERY_MS = 30_000;
let lastCheck = 0;

/**
 * Keeps sold-out products from staying sold out forever. Two steps:
 *
 *  1. A product that's due — out of stock, with a restock time that has
 *     passed — is refilled to RESTOCK_QUANTITY and its restock time cleared.
 *  2. A product that's out of stock with NO restock time gets one,
 *     RESTOCK_AFTER_HOURS from now, so the shop shows a "Back in stock in…"
 *     countdown and step 1 picks it up when it arrives. (A time an admin set
 *     by hand in the product form is respected as-is.)
 *
 * It's called when the home page and a product page are built, so a refill
 * lands within minutes of being due — Vercel's free plan only allows cron
 * jobs once a day, which would be far too coarse for "a few hours". The
 * daily cron calls it too as a backstop.
 *
 * Set AUTO_RESTOCK=off in the environment to turn all of this off (e.g. if
 * this ever becomes a real shop where stock only changes when you say so).
 */
export async function runAutoRestock(
  options: { force?: boolean } = {}
): Promise<{ refilled: number; clocksStarted: number }> {
  const none = { refilled: 0, clocksStarted: 0 };
  if (process.env.AUTO_RESTOCK === "off") return none;

  const now = Date.now();
  if (!options.force && now - lastCheck < CHECK_EVERY_MS) return none;
  lastCheck = now;

  try {
    const refilled = await db
      .update(products)
      .set({ stock: RESTOCK_QUANTITY, restockAt: null, updatedAt: new Date() })
      .where(and(lte(products.stock, 0), lte(products.restockAt, new Date(now))))
      .returning({ id: products.id });

    const clocksStarted = await db
      .update(products)
      .set({ restockAt: new Date(now + RESTOCK_AFTER_HOURS * 60 * 60 * 1000) })
      .where(and(lte(products.stock, 0), isNull(products.restockAt)))
      .returning({ id: products.id });

    return { refilled: refilled.length, clocksStarted: clocksStarted.length };
  } catch (error) {
    // A hiccup here must never take a page down with it.
    console.error("Auto-restock check failed:", error);
    return none;
  }
}
