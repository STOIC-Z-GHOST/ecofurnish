"use server";

import { headers } from "next/headers";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { orders, orderItems, orderStockHolds, products } from "@/db/schema";
import { auth } from "@/lib/auth";
import { initializeChapaTransaction, verifyChapaTransaction } from "@/lib/chapa";
import { sendOrderConfirmationEmail, sendLowStockAlertEmail, sendOrderNoticeEmail } from "@/lib/email";
import { sendTelegramMessage } from "@/lib/telegram";
import { escapeHtml } from "@/lib/escape-html";
import { issueStoreCredit, refundOrder } from "@/lib/refunds";
import { restockExpectedFor, sweepWaitingOrders, takeStock } from "@/lib/stock";
import { applyReferralRewards, qualifyReferralIfFirstPurchase, reverseOrderRewardUsages } from "@/lib/referrals";
import { getEffectivePrice } from "@/lib/pricing";
import { canViewOrder } from "@/lib/order-access";

interface PlaceOrderInput {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  city: string;
  notes?: string;
  // Best-effort browser geolocation from checkout — see
  // orders.customerLat/customerLng in db/schema.ts. Never required.
  lat?: number;
  lng?: number;
  // price is intentionally NOT trusted from here — see the re-pricing
  // block below. It's only accepted in the input type because the cart
  // (a client-side context) naturally carries one; it's never read.
  items: { productId: string; name: string; price: string; quantity: number }[];
  // A referral reward code the customer typed in at checkout, and/or a
  // flag to auto-apply any store credit they've earned from referrals.
  promoCode?: string;
  useStoreCredit?: boolean;
}

// Sanity bounds. Real availability is enforced below against each product's
// stock; these just stop absurd or malformed requests (a server action is a
// public endpoint, so the cart UI's own limits can't be relied on).
const MAX_CART_LINES = 50;
const MAX_QUANTITY_PER_PRODUCT = 99;

/**
 * Creates the order + line items as "unpaid". Stock isn't touched yet —
 * that only happens once Chapa confirms the payment actually went through,
 * so an abandoned checkout never permanently reserves inventory.
 */
export async function createOrder(input: PlaceOrderInput) {
  if (!Array.isArray(input?.items) || input.items.length === 0) {
    return { success: false as const, error: "Your cart is empty." };
  }
  if (input.items.length > MAX_CART_LINES) {
    return { success: false as const, error: "That's too many different items for one order." };
  }
  for (const item of input.items) {
    if (typeof item?.productId !== "string" || !Number.isInteger(item.quantity) || item.quantity < 1) {
      return { success: false as const, error: "Invalid item quantity." };
    }
    if (item.quantity > MAX_QUANTITY_PER_PRODUCT) {
      return { success: false as const, error: `You can order up to ${MAX_QUANTITY_PER_PRODUCT} of one item at a time.` };
    }
  }
  const textFields: [unknown, number][] = [
    [input.customerName, 100],
    [input.customerPhone, 30],
    [input.shippingAddress, 200],
    [input.city, 100],
    [input.notes ?? "", 1000],
  ];
  if (textFields.some(([value, max]) => typeof value !== "string" || value.length > max)) {
    return { success: false as const, error: "One of your delivery details is missing or too long." };
  }

  const session = await auth.api.getSession({ headers: await headers() });
  // The checkout page already gates this in the UI, but that's only a
  // convenience — enforce it here too, since a server action is directly
  // callable and the UI check alone wouldn't stop that.
  if (!session?.user) {
    return { success: false as const, error: "Please sign in to check out." };
  }
  const userId = session.user.id;

  // Re-price every line from the database rather than trusting whatever
  // the client sent. The cart is a client-side context, so its prices —
  // and the subtotal built from them — are just as spoofable as any other
  // form input, and this total is what Chapa is actually told to charge.
  // A cart price is only ever a snapshot for display; this re-fetch is the
  // one place that price becomes real money.
  const productIds = [...new Set(input.items.map((i) => i.productId))];
  const dbProducts = await db.select().from(products).where(inArray(products.id, productIds));
  const productById = new Map(dbProducts.map((p) => [p.id, p]));

  // Stock, checked on the TOTAL requested per product — a request that lists
  // the same product on several lines can't slip past a per-line check.
  // (The cart UI already caps quantities, but items added from the wishlist
  // carry a placeholder stock of 99 there, and the UI isn't a security
  // boundary anyway.)
  const requestedByProduct = new Map<string, number>();
  for (const item of input.items) {
    requestedByProduct.set(item.productId, (requestedByProduct.get(item.productId) ?? 0) + item.quantity);
  }
  for (const [productId, quantity] of requestedByProduct) {
    const product = productById.get(productId);
    if (!product) continue; // reported as "no longer available" in the loop below
    if (quantity > MAX_QUANTITY_PER_PRODUCT) {
      return { success: false as const, error: `You can order up to ${MAX_QUANTITY_PER_PRODUCT} of one item at a time.` };
    }
    if (quantity > product.stock) {
      return {
        success: false as const,
        error:
          product.stock <= 0
            ? `Sorry — ${product.name} just sold out. Please remove it from your cart to continue.`
            : `Only ${product.stock} of ${product.name} left — please lower the quantity in your cart.`,
      };
    }
  }

  const pricedItems: { orderId: string; productId: string; productName: string; unitPrice: string; quantity: number }[] = [];
  let subtotal = 0;
  for (const item of input.items) {
    const product = productById.get(item.productId);
    if (!product) {
      return { success: false as const, error: "One of the items in your cart is no longer available." };
    }
    const unitPrice = getEffectivePrice(product);
    subtotal += parseFloat(unitPrice) * item.quantity;
    pricedItems.push({
      orderId: "", // filled in once the order row exists, below
      productId: product.id,
      productName: product.name,
      unitPrice,
      quantity: item.quantity,
    });
  }

  // Silently dropped if missing, malformed, or out of range — this is a
  // convenience for the dispatcher's starting pin later, never
  // something worth failing an order over.
  const hasValidLocation =
    typeof input.lat === "number" &&
    typeof input.lng === "number" &&
    Number.isFinite(input.lat) &&
    Number.isFinite(input.lng) &&
    Math.abs(input.lat) <= 90 &&
    Math.abs(input.lng) <= 180;

  // Inserted with a provisional totalAmount (no discount applied yet) and
  // updated below once applyReferralRewards runs — that function attaches
  // a referralRewardUsages row to whatever it redeems, which needs a real
  // orderId to point at (see reverseOrderRewardUsages in lib/referrals.ts,
  // which is how an abandoned/cancelled order's reward gets handed back
  // instead of staying burned forever).
  const [order] = await db
    .insert(orders)
    .values({
      userId,
      customerName: input.customerName,
      // From the signed-in account, never from the request: otherwise anyone
      // with an account could put another person's address on an order and
      // have your confirmation / delivery-PIN emails sent to them.
      customerEmail: session.user.email,
      customerPhone: input.customerPhone,
      shippingAddress: input.shippingAddress,
      city: input.city,
      notes: input.notes,
      customerLat: hasValidLocation ? input.lat!.toFixed(6) : null,
      customerLng: hasValidLocation ? input.lng!.toFixed(6) : null,
      totalAmount: subtotal.toFixed(2),
    })
    .returning();

  let discountAmount = "0.00";
  let discountNote: string | null = null;
  if (input.promoCode || input.useStoreCredit) {
    const result = await applyReferralRewards(
      userId,
      subtotal,
      { promoCode: input.promoCode, useStoreCredit: input.useStoreCredit },
      order.id
    );
    discountAmount = result.discountAmount;
    discountNote = result.note;
  }
  const totalAmount = Math.max(0, subtotal - parseFloat(discountAmount)).toFixed(2);

  await db
    .update(orders)
    .set({ totalAmount, discountAmount, discountNote })
    .where(eq(orders.id, order.id));

  await db.insert(orderItems).values(
    pricedItems.map((item) => ({ ...item, orderId: order.id }))
  );

  return { success: true as const, orderId: order.id };
}

/** Starts a Chapa transaction for an already-created order and returns its hosted checkout URL. */
export async function createCheckoutSession(orderId: string) {
  // Without this, anyone who knew an order's ID could start a payment for it:
  // that overwrites the order's chapaTxRef (so the real customer's payment
  // would no longer match and wouldn't be confirmed) and returns a Chapa
  // checkout page that shows the customer's name, email and phone.
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return { success: false as const, error: "Please sign in to continue to payment." };
  }

  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  // Same answer whether the order doesn't exist or just isn't theirs.
  // role is blanked so even an admin can't open a payment on a customer's behalf.
  if (!order || !canViewOrder(order, { ...session.user, role: null })) {
    return { success: false as const, error: "Order not found." };
  }
  if (order.paymentStatus === "paid") {
    return { success: false as const, error: "This order has already been paid." };
  }
  if (order.status === "cancelled") {
    return { success: false as const, error: "This order was cancelled." };
  }

  // Chapa requires a unique tx_ref per attempt — reusing the order id alone
  // would collide if the customer retries after a cancel, so we timestamp it.
  // Chapa also caps tx_ref at 50 characters — the full order UUID plus a
  // prefix and timestamp blew past that, so only the first 8 hex characters
  // are used. Nothing parses orderId back out of this string (see the
  // Chapa webhook handler), so truncating it doesn't break anything.
  const txRef = `EF-${orderId.slice(0, 8)}-${Date.now()}`;
  const [firstName, ...rest] = order.customerName.split(" ");

  let result: Awaited<ReturnType<typeof initializeChapaTransaction>>;
  try {
    result = await initializeChapaTransaction({
      amount: parseFloat(order.totalAmount),
      email: order.customerEmail,
      firstName: firstName || order.customerName,
      lastName: rest.join(" ") || firstName || order.customerName,
      phoneNumber: order.customerPhone,
      txRef,
      orderId,
      title: "EcoFurnish",
    });
  } catch (error) {
    // Chapa unreachable / timed out / returned something that isn't JSON —
    // give the customer a clear message instead of a raw server error.
    console.error("Chapa initialize threw:", error);
    return { success: false as const, error: "We couldn't reach the payment provider — please try again in a moment." };
  }

  if (!result.success) {
    return { success: false as const, error: result.error };
  }

  await db.update(orders).set({ chapaTxRef: txRef }).where(eq(orders.id, orderId));

  return { success: true as const, url: result.checkoutUrl };
}

/**
 * The customer's payment went through but the item is gone — someone
 * else's payment took the last unit first. Rather than just refunding,
 * the order is parked and the customer is asked what they'd like:
 * refund, wait for the restock, or turn the money into store credit (see
 * resolveSoldOutOrder). If parking fails for any reason (e.g. the
 * order_stock_holds table hasn't been created yet) they're refunded
 * automatically so a paid customer is never left stuck.
 */
async function holdOrderForChoice(order: typeof orders.$inferSelect, soldOutName: string) {
  try {
    await db.update(orders).set({ status: "pending" }).where(eq(orders.id, order.id));
    await db
      .insert(orderStockHolds)
      .values({ orderId: order.id, state: "choose", note: soldOutName })
      .onConflictDoNothing();
  } catch (error) {
    console.error("Couldn't hold the sold-out order, refunding instead:", error);
    await refundOrder(order, soldOutName);
    return;
  }

  const shortId = order.id.slice(0, 8);
  await sendOrderNoticeEmail({
    toEmail: order.customerEmail,
    subject: "Action needed: your EcoFurnish item just sold out",
    paragraphs: [
      `Hi ${order.customerName.split(" ")[0] || "there"},`,
      `Your payment for order ${shortId} went through, but ${soldOutName} sold out a moment before we could confirm it. You haven't lost anything — please choose what you'd like us to do:`,
      "1. Refund — the full amount goes back to your original payment method.",
      "2. Wait for the restock — we keep your order and confirm it automatically when the item is back. The price you paid is locked, so you never pay more, even if the price goes up.",
      "3. Store credit — the full amount becomes credit you can spend on anything else in the shop.",
    ],
    cta: { label: "Choose an option", path: `/order-confirmation/${order.id}` },
  });
  await sendTelegramMessage(
    `⏳ <b>Sold out at payment</b> — order <code>${shortId}</code> (${escapeHtml(order.totalAmount)} ETB): ${escapeHtml(soldOutName)}. Customer was emailed to choose refund / wait / store credit.`
  );
}

/**
 * Called from the order-confirmation page (and from the Chapa callback
 * route) to confirm — server-to-server, not just via the browser redirect —
 * that a transaction actually succeeded, before doing anything irreversible
 * (decrementing stock, sending the confirmation email). Safe to call more
 * than once: it's a no-op if the order is already marked paid.
 */
export async function confirmPayment(orderId: string, txRef: string) {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) return { paid: false as const };

  // Anything other than "unpaid" is already settled — paid, or cancelled
  // and refunded because the item sold out — so there's nothing to redo.
  if (order.paymentStatus !== "unpaid") {
    return { paid: order.paymentStatus === "paid" } as { paid: boolean; outOfStock?: true };
  }

  if (order.chapaTxRef !== txRef) {
    return { paid: false as const };
  }

  const { paid, raw } = await verifyChapaTransaction(txRef);
  if (!paid) return { paid: false as const };

  // Defence in depth: "Chapa says success" should also mean the right
  // amount in the right currency. If Chapa reports either field and it
  // doesn't line up with the order, don't release the goods. (If a field
  // is simply absent from the response the check is skipped, so this can
  // never block a payment on a response-shape surprise.)
  const paidAmount = parseFloat(raw.data?.amount ?? "");
  const currency = raw.data?.currency;
  if (Number.isFinite(paidAmount) && paidAmount + 0.01 < parseFloat(order.totalAmount)) {
    console.error(`Chapa amount mismatch for order ${orderId}: paid ${paidAmount}, expected ${order.totalAmount}`);
    return { paid: false as const };
  }
  if (currency && currency.toUpperCase() !== "ETB") {
    console.error(`Chapa currency mismatch for order ${orderId}: ${currency}`);
    return { paid: false as const };
  }

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));

  // Claim the order in one atomic step. The Chapa callback and the browser
  // redirect often arrive together, and both used to run everything below
  // (double stock decrement, double confirmation email); now only the call
  // that actually flips unpaid -> paid carries on.
  const claimed = await db
    .update(orders)
    .set({ paymentStatus: "paid", status: "processing" })
    .where(and(eq(orders.id, orderId), eq(orders.paymentStatus, "unpaid")))
    .returning({ id: orders.id });
  if (claimed.length === 0) {
    const [fresh] = await db
      .select({ paymentStatus: orders.paymentStatus })
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);
    return { paid: fresh?.paymentStatus === "paid" } as { paid: boolean; outOfStock?: true };
  }

  // This is a public demo: if every paid order lowered the real, shared
  // stock number, a few test purchases would show "Out of stock" to every
  // visitor. So by default the real number is left alone, and each browser
  // gets its own temporary "bought it" view instead (lib/simulated-stock.ts,
  // which resets itself every 24 hours). To run this as a real store, set
  // DECREMENT_STOCK_ON_PAYMENT=true in the environment and paid orders will
  // lower real stock (and send the low-stock alert) again.
  //
  // In that real-store mode, two people can pay for the last unit at the
  // same moment. takeStock lets the database pick the winner; whoever loses
  // is asked what they'd like — refund, wait for the restock, or store
  // credit (see holdOrderForChoice) — instead of being sold something that
  // no longer exists.
  if (process.env.DECREMENT_STOCK_ON_PAYMENT === "true") {
    const taken = await takeStock(items);
    if (!taken.ok) {
      await holdOrderForChoice(order, taken.productName);
      return { paid: false, outOfStock: true } as { paid: boolean; outOfStock?: true };
    }
    for (const alert of taken.lowStock) {
      await sendLowStockAlertEmail(alert.name, alert.stock);
    }
  }

  // orders.userId can be null on legacy/guest orders — nothing to
  // qualify in that case.
  if (order.userId) {
    await qualifyReferralIfFirstPurchase(order.userId);
  }

  await sendOrderConfirmationEmail({
    toEmail: order.customerEmail,
    customerName: order.customerName,
    orderId: order.id,
    totalAmount: order.totalAmount,
    items: items.map((i) => ({
      productName: i.productName,
      unitPrice: i.unitPrice,
      quantity: i.quantity,
    })),
  });

  return { paid: true } as { paid: boolean; outOfStock?: true };
}

/**
 * The customer's answer to a sold-out order: "refund", "wait" for the
 * restock, or "credit" (store credit for what they paid). Only the order's
 * own customer can answer. Each answer first claims the hold with a single
 * conditional update, so a double-click or two open tabs can't refund twice
 * or refund an order that was just restocked and fulfilled.
 */
export async function resolveSoldOutOrder(orderId: string, choice: "refund" | "wait" | "credit") {
  if (choice !== "refund" && choice !== "wait" && choice !== "credit") {
    return { success: false as const, error: "Unknown option." };
  }
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { success: false as const, error: "Please sign in first." };

  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order || !canViewOrder(order, { ...session.user, role: null })) {
    return { success: false as const, error: "Order not found." };
  }

  const [hold] = await db
    .select()
    .from(orderStockHolds)
    .where(eq(orderStockHolds.orderId, orderId))
    .limit(1);
  const allowedFrom = choice === "wait" ? ["choose"] : ["choose", "waiting"];
  if (!hold || !allowedFrom.includes(hold.state)) {
    return {
      success: false as const,
      error: "This order has already been taken care of — refresh the page to see where it stands.",
    };
  }
  const soldOutName = hold.note ?? "the item";

  if (choice === "credit" && !order.userId) {
    return { success: false as const, error: "Store credit needs a signed-in account — please choose a refund." };
  }

  if (choice === "wait") {
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
    const restock = await restockExpectedFor(items.map((i) => i.productId));
    if (!restock.expected) {
      return {
        success: false as const,
        error: "We don't have a restock date for this item yet — please choose a refund or store credit.",
      };
    }
  }

  // Claim: only one request can move the hold out of its current state.
  const [claimed] = await db
    .update(orderStockHolds)
    .set({ state: choice === "wait" ? "waiting" : "resolving" })
    .where(and(eq(orderStockHolds.orderId, orderId), eq(orderStockHolds.state, hold.state)))
    .returning({ orderId: orderStockHolds.orderId });
  if (!claimed) {
    return { success: false as const, error: "This order was just updated — refresh the page." };
  }

  const shortId = order.id.slice(0, 8);
  try {
    if (choice === "wait") {
      await sendOrderNoticeEmail({
        toEmail: order.customerEmail,
        subject: "We're holding your EcoFurnish order until it's back in stock",
        paragraphs: [
          `Hi ${order.customerName.split(" ")[0] || "there"},`,
          `Thanks — we're holding order ${shortId} until ${soldOutName} is back in stock, and we'll email you the moment it's confirmed.`,
          `You've already paid ${order.totalAmount} ETB and that price is locked in: you won't be asked for more, even if the price goes up. You can switch to a refund or store credit any time before then.`,
        ],
        cta: { label: "View your order", path: `/order-confirmation/${order.id}` },
      });
      await sendTelegramMessage(
        `🕒 Order <code>${shortId}</code> (${escapeHtml(order.totalAmount)} ETB) will wait for ${escapeHtml(soldOutName)} to be restocked.`
      );
      // If the restock already landed while they were deciding, fulfil now.
      await sweepWaitingOrders();
      return { success: true as const, outcome: "waiting" as const };
    }

    if (choice === "refund") {
      const result = await refundOrder(order, soldOutName);
      await db.delete(orderStockHolds).where(eq(orderStockHolds.orderId, orderId));
      return {
        success: true as const,
        outcome: (result.refunded ? "refunded" : "refund_pending") as "refunded" | "refund_pending",
      };
    }

    // choice === "credit"
    await issueStoreCredit(order.userId as string, order.totalAmount);
    await db
      .update(orders)
      .set({ status: "cancelled", paymentStatus: "credited" })
      .where(eq(orders.id, orderId));
    await reverseOrderRewardUsages(orderId);
    await db.delete(orderStockHolds).where(eq(orderStockHolds.orderId, orderId));
    await sendOrderNoticeEmail({
      toEmail: order.customerEmail,
      subject: "Your EcoFurnish store credit is ready",
      paragraphs: [
        `Hi ${order.customerName.split(" ")[0] || "there"},`,
        `We've turned the ${order.totalAmount} ETB you paid for order ${shortId} into store credit. It's on your account now — tick "use store credit" at checkout to spend it on anything in the shop.`,
      ],
      cta: { label: "Browse the shop", path: "/" },
    });
    await sendTelegramMessage(
      `🎟️ Order <code>${shortId}</code> (${escapeHtml(order.totalAmount)} ETB) converted to store credit (${escapeHtml(soldOutName)} sold out).`
    );
    return { success: true as const, outcome: "credited" as const };
  } catch (error) {
    console.error("Resolving the sold-out order failed:", error);
    // Put the hold back so the customer can try again.
    await db
      .update(orderStockHolds)
      .set({ state: hold.state })
      .where(eq(orderStockHolds.orderId, orderId));
    return { success: false as const, error: "Something went wrong — please try again." };
  }
}

/**
 * Items on the signed-in customer's paid orders that are waiting on a
 * sold-out product, for the "Waiting for restock" section of the cart page.
 * Returns [] for guests and if anything goes wrong — it's a nice-to-have.
 */
export async function getWaitingOrderItems() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return [];
    const rows = await db
      .select({
        orderId: orders.id,
        state: orderStockHolds.state,
        name: orderItems.productName,
        quantity: orderItems.quantity,
        productId: orderItems.productId,
        imageUrl: products.imageUrl,
        restockAt: products.restockAt,
      })
      .from(orderStockHolds)
      .innerJoin(orders, eq(orders.id, orderStockHolds.orderId))
      .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
      .leftJoin(products, eq(products.id, orderItems.productId))
      .where(
        and(
          eq(orders.userId, session.user.id),
          inArray(orderStockHolds.state, ["choose", "waiting", "fulfilling"])
        )
      );
    return rows.map((r) => ({
      orderId: r.orderId,
      state: r.state,
      name: r.name,
      quantity: r.quantity,
      productId: r.productId,
      imageUrl: r.imageUrl,
      restockAt: r.restockAt ? r.restockAt.toISOString() : null,
    }));
  } catch (error) {
    console.error("Couldn't load items waiting for restock:", error);
    return [];
  }
}
