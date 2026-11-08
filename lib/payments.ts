import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orderPayments, orders } from "@/db/schema";
import { verifyChapaTransaction, type ChapaVerifyData } from "@/lib/chapa";

export type PaymentRecord = typeof orderPayments.$inferSelect;

// Chapa references look like "APQ1kcaiCZi2". Anything else is rejected so
// a odd value can never end up inside a link we show or email.
const REFERENCE_PATTERN = /^[A-Za-z0-9_-]{4,64}$/;

/** True while the app is using Chapa TEST keys (their secret keys start CHASECK_TEST). */
export function isChapaTestMode(): boolean {
  return (process.env.CHAPA_SECRET_KEY ?? "").startsWith("CHASECK_TEST");
}

/**
 * Whether to link to Chapa's own hosted receipt (chapa.link/payment-receipt/…).
 * Off by default while on test keys, because that page was seen returning
 * "404 Page not found" for a test-mode payment; on by default with live
 * keys. Force it either way with CHAPA_RECEIPT_LINKS=on or =off. The
 * receipt on our own order page never depends on this.
 */
export function chapaReceiptLinksEnabled(): boolean {
  const setting = process.env.CHAPA_RECEIPT_LINKS;
  if (setting === "on") return true;
  if (setting === "off") return false;
  return !isChapaTestMode();
}

/** The link to Chapa's own receipt page, or null if the reference looks wrong. */
export function chapaReceiptUrl(reference: string | null | undefined): string | null {
  if (!reference || !REFERENCE_PATTERN.test(reference)) return null;
  return `https://chapa.link/payment-receipt/${encodeURIComponent(reference)}`;
}

/**
 * Saves what Chapa reported about a successful payment. Safe to call twice
 * (the second call is ignored) and NEVER throws: a receipt is a nice-to-have
 * and must never be able to fail an order that was paid for.
 */
export async function recordPayment(orderId: string, data: ChapaVerifyData | undefined) {
  try {
    if (!data?.reference || !REFERENCE_PATTERN.test(data.reference)) return;
    const paidAt = data.created_at ? new Date(data.created_at) : null;
    await db
      .insert(orderPayments)
      .values({
        orderId,
        chapaReference: data.reference,
        method: data.method ?? null,
        currency: data.currency ?? null,
        amount: data.amount ?? null,
        charge: data.charge ?? null,
        paidAt: paidAt && !Number.isNaN(paidAt.getTime()) ? paidAt : null,
      })
      .onConflictDoNothing();
  } catch (error) {
    console.error("Couldn't record the payment:", error);
  }
}

/**
 * The saved payment for an order, if there is one. Orders paid before
 * receipts existed have none, so for a paid order this asks Chapa once and
 * saves the answer ("backfill on view"). Returns null on any failure —
 * including the table not existing yet — so the page just shows no receipt.
 */
export async function getPaymentForOrder(
  order: Pick<typeof orders.$inferSelect, "id" | "paymentStatus" | "chapaTxRef">
): Promise<PaymentRecord | null> {
  try {
    const [existing] = await db
      .select()
      .from(orderPayments)
      .where(eq(orderPayments.orderId, order.id))
      .limit(1);
    if (existing) return existing;

    // Only a payment that really happened can have a receipt.
    const wasPaid = ["paid", "refunded", "refund_pending", "credited"].includes(order.paymentStatus);
    if (!wasPaid || !order.chapaTxRef) return null;

    const { paid, raw } = await verifyChapaTransaction(order.chapaTxRef);
    if (!paid) return null;
    await recordPayment(order.id, raw.data);

    const [saved] = await db
      .select()
      .from(orderPayments)
      .where(eq(orderPayments.orderId, order.id))
      .limit(1);
    return saved ?? null;
  } catch (error) {
    console.error("Couldn't load the payment receipt:", error);
    return null;
  }
}
