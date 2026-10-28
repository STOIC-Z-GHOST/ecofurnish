import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, deliveryAssignments, orderStockHolds } from "@/db/schema";
import { sendOrderStatusUpdateEmail } from "@/lib/email";
import { ORDER_STATUSES } from "@/lib/order-statuses";
import { reverseOrderRewardUsages } from "@/lib/referrals";

export { ORDER_STATUSES, type OrderStatus } from "@/lib/order-statuses";

/**
 * Shared status-transition core, used by both the admin panel's manual
 * override (app/admin/actions.ts, requireAdmin-gated) and the dispatcher
 * delivery-claim approval flow (app/dispatcher/actions.ts,
 * requireDispatcher-gated). Callers are responsible for their own auth
 * check before calling this — it has no single "right" role to require,
 * so it isn't gated itself.
 */
export async function applyOrderStatus(orderId: string, status: string) {
  if (!(ORDER_STATUSES as readonly string[]).includes(status)) {
    throw new Error(`Invalid status: ${status}`);
  }

  const [existing] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!existing) throw new Error("Order not found");

  await db.update(orders).set({ status }).where(eq(orders.id, orderId));

  // Any order reaching a terminal state should free up its driver
  // regardless of which path got it there — the admin's manual
  // override has no idea a delivery assignment even exists, so without
  // this an admin-forced "delivered"/"cancelled" would leave the
  // assignment stuck "active" forever, permanently blocking that
  // driver from being handed anything new (see getApprovedDrivers in
  // app/dispatcher/actions.ts, which filters on assignment status).
  if (status === "delivered" || status === "cancelled") {
    await db
      .update(deliveryAssignments)
      .set({ status: status === "delivered" ? "completed" : "cancelled" })
      .where(
        and(eq(deliveryAssignments.orderId, orderId), eq(deliveryAssignments.status, "active"))
      );
  }

  // A cancelled order shouldn't leave a referral reward permanently
  // spent for nothing — whether it's an admin cancelling a paid order
  // after the fact, or the expire-orders cron catching an abandoned
  // checkout that never paid at all (see app/api/cron/expire-orders).
  // No-op if this order never touched any reward, and safe to call
  // twice (reverseOrderRewardUsages skips usages already reversed).
  if (status === "cancelled") {
    await reverseOrderRewardUsages(orderId);
    // A cancelled order that was waiting on a sold-out item must never be
    // fulfilled later when the restock lands. (Its own try/catch: the
    // holds table is a separate, optional piece.)
    try {
      await db.delete(orderStockHolds).where(eq(orderStockHolds.orderId, orderId));
    } catch (error) {
      console.error("Couldn't clear the stock hold on cancel:", error);
    }
  }

  // Only notify on an actual change — re-applying the same status
  // (nothing to tell the customer) shouldn't re-send anything.
  if (existing.status !== status) {
    await sendOrderStatusUpdateEmail(
      existing.customerEmail,
      existing.customerName,
      orderId,
      status,
      existing.trackingNote
    );
  }

  return existing;
}
