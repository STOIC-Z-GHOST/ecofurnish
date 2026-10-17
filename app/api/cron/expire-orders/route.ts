import { and, eq, lt, ne } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { applyOrderStatus } from "@/lib/orders";
import { rejectUnlessCron } from "@/lib/cron-auth";
import { runAutoRestock } from "@/lib/auto-restock";

// How long an order gets to actually pay before we give up on it. Chapa
// checkout normally completes in minutes; this is a generous buffer for
// someone stepping away mid-payment, not a tight timeout. Note the cron
// itself only runs once a day (see vercel.json) — Vercel's Hobby plan
// caps cron frequency at daily, so in the worst case an abandoned order
// sits unpaid for up to ~24h before this actually catches it, not just
// this window. Fine for what this does (reclaiming a referral reward
// from a checkout nobody ever finished) — nothing here is time-critical
// enough to need Vercel Pro's more-frequent cron scheduling.
const EXPIRY_WINDOW_MS = 2 * 60 * 60 * 1000; // 2 hours

// Same auth pattern as app/api/cron/daily-digest — Vercel calls this with
// `Authorization: Bearer ${CRON_SECRET}`, checked only in production so
// it's easy to hit manually while testing locally.
//
// Finds orders that were never paid and are past the expiry window, and
// cancels them via the shared applyOrderStatus core. That's the piece
// that actually matters here: cancelling hands back any referral reward
// (promo code / store credit) the order consumed at checkout (see
// reverseOrderRewardUsages in lib/referrals.ts) — without this cron, a
// customer who just closes the tab on an unpaid checkout would otherwise
// lose that reward forever, since nothing else ever revisits the order.
export async function GET(request: NextRequest) {
  const denied = rejectUnlessCron(request);
  if (denied) return denied;

  const cutoff = new Date(Date.now() - EXPIRY_WINDOW_MS);
  const stale = await db
    .select({ id: orders.id })
    .from(orders)
    .where(
      and(eq(orders.paymentStatus, "unpaid"), lt(orders.createdAt, cutoff), ne(orders.status, "cancelled"))
    );

  let expiredCount = 0;
  for (const order of stale) {
    // Re-check right before acting: a Chapa payment could land between
    // the query above and this iteration, and applyOrderStatus itself
    // doesn't look at paymentStatus — it'll cancel whatever it's told
    // to. Skipping here is what stops a payment that clears in that
    // window from getting run over by a stale-order cancellation.
    const [fresh] = await db
      .select({ paymentStatus: orders.paymentStatus })
      .from(orders)
      .where(eq(orders.id, order.id))
      .limit(1);
    if (fresh?.paymentStatus !== "unpaid") continue;

    await applyOrderStatus(order.id, "cancelled");
    expiredCount++;
  }

  // Backstop for the on-page check in lib/auto-restock.ts: even if nobody
  // visited, sold-out products still get their clock started / refilled
  // once a day.
  const restock = await runAutoRestock({ force: true });

  return NextResponse.json({ expired: expiredCount, restock });
}
