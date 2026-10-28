import { and, asc, eq, gte, inArray, isNotNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { orderItems, orders, orderStockHolds, products } from "@/db/schema";
import { sendLowStockAlertEmail, sendOrderNoticeEmail } from "@/lib/email";
import { qualifyReferralIfFirstPurchase } from "@/lib/referrals";

export const LOW_STOCK_THRESHOLD = 5;

/**
 * Takes the ordered quantities out of real stock, safely when several
 * people buy the same last item at once. Each product is ONE statement —
 * "subtract only if enough is left" — so the database itself decides who
 * gets the last unit; two buyers can never both succeed (the old
 * read-then-write could let both through). If any line falls short, the
 * lines already taken are put back and nothing is left half-done.
 */
export async function takeStock(items: { productId: string; productName: string; quantity: number }[]) {
  const totals = new Map<string, { name: string; quantity: number }>();
  for (const item of items) {
    const entry = totals.get(item.productId);
    totals.set(item.productId, {
      name: item.productName,
      quantity: (entry?.quantity ?? 0) + item.quantity,
    });
  }

  const taken: { productId: string; quantity: number }[] = [];
  const lowStock: { name: string; stock: number }[] = [];
  for (const [productId, { name, quantity }] of totals) {
    const [updated] = await db
      .update(products)
      .set({ stock: sql`${products.stock} - ${quantity}` })
      .where(and(eq(products.id, productId), gte(products.stock, quantity)))
      .returning({ stock: products.stock });

    if (!updated) {
      for (const t of taken) {
        await db
          .update(products)
          .set({ stock: sql`${products.stock} + ${t.quantity}` })
          .where(eq(products.id, t.productId));
      }
      return { ok: false as const, productName: name };
    }

    taken.push({ productId, quantity });
    // Only on the crossing, not on every purchase once it's already low.
    if (updated.stock <= LOW_STOCK_THRESHOLD && updated.stock + quantity > LOW_STOCK_THRESHOLD) {
      lowStock.push({ name, stock: updated.stock });
    }
  }
  return { ok: true as const, lowStock };
}

/**
 * Is a restock coming for these products? Yes if auto-restock is on (a
 * sold-out product always gets a refill clock) or an admin set a restock
 * time. `at` is the earliest known time, if any — used only for display.
 */
export async function restockExpectedFor(productIds: string[]) {
  const autoRestock = process.env.AUTO_RESTOCK !== "off";
  let at: Date | null = null;
  if (productIds.length > 0) {
    const rows = await db
      .select({ restockAt: products.restockAt })
      .from(products)
      .where(and(inArray(products.id, productIds), isNotNull(products.restockAt)));
    for (const r of rows) {
      if (r.restockAt && (!at || r.restockAt < at)) at = r.restockAt;
    }
  }
  return { expected: autoRestock || at !== null, at };
}

/**
 * Fulfils orders whose customers chose to wait for a restock, oldest
 * first, as soon as everything on the order is in stock again. The price
 * is whatever was paid at checkout (order_items.unit_price is a snapshot),
 * so a price rise after the restock never asks them for more money.
 *
 * Safe to call from anywhere, any number of times, concurrently: each
 * order is claimed with a single conditional update before any stock is
 * touched. Never throws — it runs inside page builds and admin saves.
 */
export async function sweepWaitingOrders(): Promise<number> {
  let fulfilled = 0;
  try {
    const waiting = await db
      .select({ orderId: orderStockHolds.orderId })
      .from(orderStockHolds)
      .where(eq(orderStockHolds.state, "waiting"))
      .orderBy(asc(orderStockHolds.since));

    for (const { orderId } of waiting) {
      const [claimed] = await db
        .update(orderStockHolds)
        .set({ state: "fulfilling" })
        .where(and(eq(orderStockHolds.orderId, orderId), eq(orderStockHolds.state, "waiting")))
        .returning({ orderId: orderStockHolds.orderId });
      if (!claimed) continue;

      const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
      if (!order || order.status === "cancelled" || order.paymentStatus !== "paid") {
        // Cancelled/refunded in the meantime — nothing to fulfil.
        await db.delete(orderStockHolds).where(eq(orderStockHolds.orderId, orderId));
        continue;
      }

      const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
      const taken = await takeStock(items);
      if (!taken.ok) {
        // Still not enough — back in line, keeping its place.
        await db
          .update(orderStockHolds)
          .set({ state: "waiting" })
          .where(eq(orderStockHolds.orderId, orderId));
        continue;
      }

      await db.update(orders).set({ status: "processing" }).where(eq(orders.id, orderId));
      await db.delete(orderStockHolds).where(eq(orderStockHolds.orderId, orderId));
      fulfilled++;

      for (const alert of taken.lowStock) {
        await sendLowStockAlertEmail(alert.name, alert.stock);
      }
      if (order.userId) await qualifyReferralIfFirstPurchase(order.userId);
      await sendOrderNoticeEmail({
        toEmail: order.customerEmail,
        subject: "Good news — your EcoFurnish item is back in stock",
        paragraphs: [
          `Hi ${order.customerName.split(" ")[0] || "there"},`,
          `The item you were waiting for is back in stock and your order ${order.id.slice(0, 8)} is now confirmed. We're getting it ready for delivery.`,
          `You already paid ${order.totalAmount} ETB — that price is locked in, so there's nothing more to pay even if the price has changed since.`,
        ],
        cta: { label: "View your order", path: `/order-confirmation/${order.id}` },
      });
    }
  } catch (error) {
    console.error("Sweeping orders waiting for restock failed:", error);
  }
  return fulfilled;
}
