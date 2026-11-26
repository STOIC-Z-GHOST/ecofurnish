import { sql, eq, and, gte } from "drizzle-orm";
import { db } from "@/db";
import { orders, orderItems, products, reviews } from "@/db/schema";
import { formatPrice } from "@/lib/currency";

const DAY_MS = 24 * 60 * 60 * 1000;
// Below this many days-of-stock-left (at current sales pace), a product
// gets flagged as worth reordering soon.
const REORDER_THRESHOLD_DAYS = 7;
// Sales velocity is measured over this trailing window — long enough that
// one unusual day doesn't skew it, short enough to reflect recent demand.
const VELOCITY_WINDOW_DAYS = 14;

export interface DailyDigest {
  revenue: {
    thisWeek: number;
    lastWeek: number;
    percentChange: number | null; // null when lastWeek was 0 — a % change against zero isn't meaningful
  };
  orderCounts: { thisWeek: number; lastWeek: number };
  customers: { total: number; newThisWeek: number };
  reorderSoon: Array<{ name: string; stock: number; daysRemaining: number }>;
  topSeller: { name: string; unitsSold: number } | null;
  satisfaction: { avgRating: number; reviewCount: number } | null;
}

/**
 * Pulls every number in the digest straight from the database — no AI
 * involved here. Keeping this deterministic means the numbers are always
 * checkable against the DB directly, and an LLM (if you wire one in later)
 * only has to phrase them, never compute them.
 */
export async function computeDailyDigest(): Promise<DailyDigest> {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * DAY_MS);
  const twoWeeksAgo = new Date(now.getTime() - 14 * DAY_MS);
  const velocityWindowStart = new Date(now.getTime() - VELOCITY_WINDOW_DAYS * DAY_MS);

  // Small store, small tables — fetching in full and reducing in memory
  // (same approach as app/admin/page.tsx) is simpler and plenty fast here.
  const [allOrders, allProducts, recentItems, customerCounts, satisfactionRow] = await Promise.all([
    db.select().from(orders),
    db.select().from(products),
    // Only join order_items back to orders that actually got paid, and
    // only within the velocity window — this is the set used for both
    // "top seller" and "days until sellout".
    db
      .select({
        productId: orderItems.productId,
        productName: orderItems.productName,
        quantity: orderItems.quantity,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(and(eq(orders.paymentStatus, "paid"), gte(orders.createdAt, velocityWindowStart))),
    // Better Auth owns the `user` table outside Drizzle's schema (see
    // db/make-admin.ts for the same pattern) — a raw query is the only
    // way to reach it from here. Better Auth's default Postgres adapter
    // creates this column as camelCase, unlike every Drizzle-managed
    // table in this app — it must stay quoted ("createdAt", not
    // created_at) or Postgres won't find it.
    db.execute(sql`
      SELECT
        count(*)::int AS total,
        count(*) FILTER (WHERE "createdAt" >= ${weekAgo.toISOString()})::int AS new_this_week
      FROM "user"
    `),
    // Store-wide, not per-product — a single satisfaction line for the
    // digest, not a breakdown (the product detail pages already show
    // per-product ratings).
    db
      .select({
        avgRating: sql<string>`avg(${reviews.rating})`,
        reviewCount: sql<string>`count(*)`,
      })
      .from(reviews),
  ]);

  const paidOrders = allOrders.filter((o) => o.paymentStatus === "paid");
  const revenueBetween = (start: Date, end: Date) =>
    paidOrders
      .filter((o) => o.createdAt >= start && o.createdAt < end)
      .reduce((sum, o) => sum + parseFloat(o.totalAmount), 0);

  const revenueThisWeek = revenueBetween(weekAgo, now);
  const revenueLastWeek = revenueBetween(twoWeeksAgo, weekAgo);

  const ordersThisWeek = paidOrders.filter((o) => o.createdAt >= weekAgo).length;
  const ordersLastWeek = paidOrders.filter(
    (o) => o.createdAt >= twoWeeksAgo && o.createdAt < weekAgo
  ).length;

  // Units sold per product in the velocity window, used for both the
  // reorder projection and the top-seller line below.
  const unitsSoldByProduct = new Map<string, { name: string; quantity: number }>();
  for (const item of recentItems) {
    const existing = unitsSoldByProduct.get(item.productId);
    unitsSoldByProduct.set(item.productId, {
      name: item.productName,
      quantity: (existing?.quantity ?? 0) + item.quantity,
    });
  }

  const reorderSoon: DailyDigest["reorderSoon"] = [];
  for (const product of allProducts) {
    const sold = unitsSoldByProduct.get(product.id)?.quantity ?? 0;
    if (sold === 0) continue; // no recent sales — no velocity to project from, so nothing to say
    const unitsPerDay = sold / VELOCITY_WINDOW_DAYS;
    const daysRemaining = product.stock / unitsPerDay;
    if (daysRemaining <= REORDER_THRESHOLD_DAYS) {
      reorderSoon.push({ name: product.name, stock: product.stock, daysRemaining });
    }
  }
  reorderSoon.sort((a, b) => a.daysRemaining - b.daysRemaining);

  let topSeller: DailyDigest["topSeller"] = null;
  for (const { name, quantity } of unitsSoldByProduct.values()) {
    if (!topSeller || quantity > topSeller.unitsSold) {
      topSeller = { name, unitsSold: quantity };
    }
  }

  // Different Drizzle driver adapters shape db.execute()'s raw-SQL result
  // slightly differently (some return { rows: [...] }, some return the
  // row array directly) — handling both here means this doesn't silently
  // break depending on exactly how neon-http normalizes it.
  const rawResult = customerCounts as unknown;
  const customerRows = Array.isArray(rawResult)
    ? rawResult
    : ((rawResult as { rows?: unknown[] })?.rows ?? []);
  const customerRow = (customerRows[0] ?? { total: 0, new_this_week: 0 }) as {
    total: number;
    new_this_week: number;
  };

  const satisfaction =
    satisfactionRow[0] && parseInt(satisfactionRow[0].reviewCount, 10) > 0
      ? {
          avgRating: parseFloat(satisfactionRow[0].avgRating),
          reviewCount: parseInt(satisfactionRow[0].reviewCount, 10),
        }
      : null;

  return {
    revenue: {
      thisWeek: revenueThisWeek,
      lastWeek: revenueLastWeek,
      percentChange:
        revenueLastWeek > 0 ? ((revenueThisWeek - revenueLastWeek) / revenueLastWeek) * 100 : null,
    },
    orderCounts: { thisWeek: ordersThisWeek, lastWeek: ordersLastWeek },
    customers: { total: customerRow.total, newThisWeek: customerRow.new_this_week },
    reorderSoon,
    topSeller,
    satisfaction,
  };
}

/** Plain-text digest — used as-is if no LLM is configured, or as the
 * source material an LLM rewrites into looser prose (see lib/gemini.ts). */
export function formatDigestAsText(digest: DailyDigest): string {
  const lines: string[] = [`<b>📊 EcoFurnish Daily Digest</b>`];

  const { revenue, orderCounts, customers } = digest;
  const changeLine =
    revenue.percentChange === null
      ? ""
      : ` (${revenue.percentChange >= 0 ? "▲" : "▼"} ${Math.abs(revenue.percentChange).toFixed(0)}% vs last week)`;
  lines.push(
    `\n💰 Revenue this week: ${formatPrice(revenue.thisWeek.toFixed(2), "ETB")}${changeLine}`
  );
  lines.push(`🧾 Orders this week: ${orderCounts.thisWeek} (last week: ${orderCounts.lastWeek})`);
  lines.push(`👥 ${customers.total} total customers (+${customers.newThisWeek} this week)`);

  if (digest.topSeller) {
    lines.push(`\n🏆 Top seller (14d): ${digest.topSeller.name}, ${digest.topSeller.unitsSold} sold`);
  }

  if (digest.satisfaction) {
    lines.push(
      `⭐ Satisfaction: ${digest.satisfaction.avgRating.toFixed(1)}/5 (${digest.satisfaction.reviewCount} reviews)`
    );
  }

  if (digest.reorderSoon.length > 0) {
    lines.push(`\n⚠️ <b>Reorder soon:</b>`);
    for (const p of digest.reorderSoon) {
      lines.push(`• ${p.name}, ${p.stock} left, ~${Math.max(1, Math.round(p.daysRemaining))}d at current pace`);
    }
  }

  return lines.join("\n");
}
