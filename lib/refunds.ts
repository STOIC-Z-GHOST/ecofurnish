import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, referralRewards } from "@/db/schema";
import { refundChapaTransaction, verifyChapaTransaction } from "@/lib/chapa";
import { sendOrderNoticeEmail } from "@/lib/email";
import { escapeHtml } from "@/lib/escape-html";
import { reverseOrderRewardUsages } from "@/lib/referrals";
import { sendTelegramMessage } from "@/lib/telegram";

type Order = typeof orders.$inferSelect;

/**
 * Cancels a paid order and refunds it in full through Chapa. Never throws
 * on a refund failure: the order is left as "refund_pending" and the owner
 * gets a Telegram message to refund it by hand, so a paid order can't just
 * vanish. Also hands back any referral reward the order had used.
 */
export async function refundOrder(order: Order, soldOutName: string) {
  await db
    .update(orders)
    .set({ status: "cancelled", paymentStatus: "refund_pending" })
    .where(eq(orders.id, order.id));
  await reverseOrderRewardUsages(order.id);

  // Chapa's refund endpoint wants their own reference for the payment,
  // which only the verify response carries — ask again rather than store it.
  let chapaReference: string | null = null;
  if (order.chapaTxRef) {
    try {
      const { raw } = await verifyChapaTransaction(order.chapaTxRef);
      chapaReference = raw.data?.reference ?? null;
    } catch (error) {
      console.error("Couldn't re-verify payment before refund:", error);
    }
  }
  const refs = [chapaReference, order.chapaTxRef].filter(
    (ref, i, all): ref is string => Boolean(ref) && all.indexOf(ref) === i
  );
  const refund = await refundChapaTransaction(
    refs,
    `Sold out: ${soldOutName}`,
    `EF-refund-${order.id.slice(0, 8)}-${Date.now()}`
  );
  if (refund.success) {
    await db.update(orders).set({ paymentStatus: "refunded" }).where(eq(orders.id, order.id));
  }

  const firstName = order.customerName.split(" ")[0] || "there";
  const shortId = order.id.slice(0, 8);
  const amount = `${order.totalAmount} ETB`;
  await sendOrderNoticeEmail({
    toEmail: order.customerEmail,
    subject: "Your EcoFurnish order has been cancelled and refunded",
    paragraphs: [
      `Hi ${firstName},`,
      `We're sorry — ${soldOutName} sold out before we could confirm order ${shortId}, so we've cancelled it.`,
      refund.success
        ? `We've refunded the full ${amount} to your original payment method. It can take a few days to show up.`
        : `We're processing your full ${amount} refund by hand and will email you as soon as it's sent.`,
      "Thank you for your patience, and sorry again.",
    ],
  });

  await sendTelegramMessage(
    refund.success
      ? `↩️ <b>Refunded</b> — order <code>${shortId}</code> (${escapeHtml(amount)}): ${escapeHtml(soldOutName)} sold out. Cancelled and refunded automatically.`
      : `🚨 <b>Manual refund needed</b> — order <code>${shortId}</code> (${escapeHtml(amount)}): ${escapeHtml(soldOutName)} sold out and the automatic Chapa refund failed. Refund tx_ref <code>${escapeHtml(order.chapaTxRef ?? "?")}</code> in the Chapa dashboard, then mark the order refunded.`
  );

  return { refunded: refund.success };
}

/**
 * Turns the money a customer paid into store credit they can spend on
 * anything (it's applied at checkout through the same "use store credit"
 * box as referral credit). The referral table has one row per (user,
 * milestone); real milestones are 5/15/30, so these use unique negative
 * numbers instead and never collide with them.
 */
export async function issueStoreCredit(userId: string, amount: string) {
  let milestone = -Math.floor(Date.now() / 1000);
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      await db.insert(referralRewards).values({
        userId,
        type: "store_credit",
        milestone,
        creditAmount: amount,
      });
      return;
    } catch (error) {
      if (attempt === 4) throw error;
      milestone -= 1; // same-second collision with an earlier credit
    }
  }
}
