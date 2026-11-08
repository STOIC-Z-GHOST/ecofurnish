import { eq, inArray } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Clock, PackageX } from "lucide-react";
import { db } from "@/db";
import { orders, orderItems, orderStockHolds, products } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { formatPrice, type Currency } from "@/lib/currency";
import { confirmPayment } from "@/app/actions/orders";
import { ClearCartOnSuccess } from "@/components/clear-cart-on-success";
import { RecordSimulatedPurchase } from "@/components/RecordSimulatedPurchase";
import { ReorderButton, type ReorderItem } from "@/components/order/ReorderButton";
import { OrderTimeline } from "@/components/order/OrderTimeline";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { canViewOrder } from "@/lib/order-access";
import { restockExpectedFor } from "@/lib/stock";
import { SoldOutChoice } from "@/components/order/SoldOutChoice";
import { PaymentReceiptCard } from "@/components/order/PaymentReceiptCard";
import { chapaReceiptLinksEnabled, getPaymentForOrder, isChapaTestMode } from "@/lib/payments";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tx_ref?: string }>;
}

export default async function OrderConfirmationPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { tx_ref } = await searchParams;

  const session = await auth.api.getSession({ headers: await headers() });

  // Logged out: reveal nothing about the order. One exception to keep the
  // payment flow robust — if this is the browser redirect back from Chapa
  // in a window that isn't signed in, still run the server-to-server payment
  // check (it only does anything when tx_ref matches this order AND Chapa
  // confirms the payment), so the order gets marked paid. Then send them to
  // sign in. The response is identical whether or not the order exists.
  if (!session?.user) {
    if (tx_ref) {
      try {
        await confirmPayment(id, tx_ref);
      } catch (error) {
        console.error("confirmPayment failed for a logged-out return:", error);
      }
    }
    redirect("/sign-in");
  }

  let [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  // Not found and not-yours look exactly the same, so this page can't be
  // used to find out which order IDs exist.
  if (!order || !canViewOrder(order, session.user)) notFound();

  // Just landed back from Chapa — verify with their servers before
  // trusting the redirect (the callback route may also be racing this).
  if (tx_ref && order.paymentStatus !== "paid") {
    await confirmPayment(id, tx_ref);
    [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  }

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));
  // Chapa's receipt details for this order (asks Chapa once for orders paid
  // before receipts existed). null -> no receipt card, nothing else changes.
  const payment = await getPaymentForOrder(order);
  const isPaid = order.paymentStatus === "paid";
  // The item sold out while this customer's payment was going through, so
  // the order was cancelled and refunded (see refundOrder in lib/refunds.ts).
  const wasRefunded = order.paymentStatus === "refunded" || order.paymentStatus === "refund_pending";
  const wasCredited = order.paymentStatus === "credited";

  // Paid, but the item sold out at the last moment and the customer is
  // choosing (or has chosen to wait). Looked up defensively: the holds
  // table is a separate optional piece and must never take this page down.
  let hold: { state: string; note: string | null } | null = null;
  try {
    const [row] = await db
      .select()
      .from(orderStockHolds)
      .where(eq(orderStockHolds.orderId, id))
      .limit(1);
    if (row) hold = { state: row.state, note: row.note };
  } catch (error) {
    console.error("Couldn't read the stock hold:", error);
  }
  const onHold = hold !== null && (hold.state === "choose" || hold.state === "waiting");

  // Reorder needs each product's *current* image/stock (not what was
  // snapshotted at order time) — and needs to gracefully skip any
  // product that's since been deleted rather than erroring.
  const productIds = items.map((item) => item.productId);
  const currentProducts =
    productIds.length > 0
      ? await db.select().from(products).where(inArray(products.id, productIds))
      : [];
  const productById = new Map(currentProducts.map((p) => [p.id, p]));
  const reorderItems: ReorderItem[] = items.flatMap((item) => {
    const current = productById.get(item.productId);
    if (!current) return [];
    return [
      {
        productId: current.id,
        name: current.name,
        price: current.price,
        imageUrl: current.imageUrl,
        stock: current.stock,
        quantity: item.quantity,
      },
    ];
  });

  const restock = onHold ? await restockExpectedFor(productIds) : { expected: false, at: null };

  const preferredCurrency = (session.user.preferredCurrency as Currency | undefined) || "ETB";

  return (
    <div className="container mx-auto max-w-2xl px-4 py-16">
      <div className="text-center">
        {onHold ? (
          <>
            <ClearCartOnSuccess />
            <PackageX className="mx-auto h-12 w-12 text-muted-foreground" />
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight">
              {hold?.state === "waiting" ? "We're holding your order" : "Your item just sold out"}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {hold?.state === "waiting"
                ? "Your payment is safe and your price is locked."
                : `Your payment went through, but ${hold?.note ?? "an item"} sold out a moment before we could confirm the order.`}
            </p>
          </>
        ) : isPaid ? (
          <>
            <ClearCartOnSuccess />
            <RecordSimulatedPurchase
              items={items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                stock: productById.get(item.productId)?.stock,
              }))}
              orderId={order.id}
              purchasedAt={order.createdAt.getTime()}
            />
            <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight">Order confirmed</h1>
            <p className="mt-2 text-muted-foreground">
              Thanks, {order.customerName.split(" ")[0]} — payment received and we&apos;ll be in
              touch at {order.customerEmail} to confirm delivery.
            </p>
          </>
        ) : wasCredited ? (
          <>
            <PackageX className="mx-auto h-12 w-12 text-muted-foreground" />
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight">Turned into store credit</h1>
            <p className="mt-2 text-muted-foreground">
              The item sold out, so we converted your {formatPrice(order.totalAmount, "ETB")} into store
              credit. Tick &ldquo;use store credit&rdquo; at checkout to spend it on anything in the shop.
            </p>
          </>
        ) : wasRefunded ? (
          <>
            <PackageX className="mx-auto h-12 w-12 text-muted-foreground" />
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight">Sorry — it just sold out</h1>
            <p className="mt-2 text-muted-foreground">
              Someone else bought the last one while your payment was going through, so we couldn&apos;t
              fulfil this order. We&apos;ve cancelled it and{" "}
              {order.paymentStatus === "refunded"
                ? "refunded the full amount to your original payment method — it can take a few days to show up."
                : `are processing your full refund — we'll email ${order.customerEmail} as soon as it's sent.`}
            </p>
          </>
        ) : (
          <>
            <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight">Payment pending</h1>
            <p className="mt-2 text-muted-foreground">
              We haven&apos;t received confirmation from Chapa yet. If you completed payment, this
              page will update shortly — refresh in a moment.
            </p>
          </>
        )}

        {onHold && hold && (
          <SoldOutChoice
            orderId={order.id}
            state={hold.state === "waiting" ? "waiting" : "choose"}
            itemName={hold.note ?? "this item"}
            amount={formatPrice(order.totalAmount, "ETB")}
            restockExpected={restock.expected}
            restockAt={restock.at ? restock.at.toISOString() : null}
            canUseCredit={Boolean(order.userId)}
          />
        )}
      </div>

      {payment && (
        <PaymentReceiptCard
          payment={payment}
          orderNumber={order.id.slice(0, 8)}
          totalLabel={formatPrice(order.totalAmount, "ETB")}
          customerName={order.customerName}
          customerEmail={order.customerEmail}
          items={items.map((i) => ({
            name: i.productName,
            quantity: i.quantity,
            unitLabel: formatPrice(i.unitPrice, "ETB"),
          }))}
          showChapaLink={chapaReceiptLinksEnabled()}
          testMode={isChapaTestMode()}
        />
      )}

      <div className="mt-10 rounded-lg border border-border/60 p-6">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Order</span>
          <span className="font-mono">{order.id.slice(0, 8)}</span>
        </div>

        {isPaid && !onHold && (
          <div className="mt-4 border-t border-border/60 pt-5">
            <OrderTimeline
              status={order.status}
              createdAt={order.createdAt}
              trackingNote={order.trackingNote}
            />
          </div>
        )}

        <div className="mt-4 space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {item.productName} × {item.quantity}
              </span>
              <span className="font-medium">
                {formatPrice((parseFloat(item.unitPrice) * item.quantity).toFixed(2), "ETB")}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 flex justify-between border-t border-border/60 pt-4 font-semibold">
          <span>Total</span>
          <div className="text-right">
            <span className="text-primary">{formatPrice(order.totalAmount, "ETB")}</span>
            {preferredCurrency !== "ETB" && (
              <p className="text-xs font-normal text-muted-foreground">
                ≈ {formatPrice(order.totalAmount, preferredCurrency)}
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 border-t border-border/60 pt-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Shipping to</p>
          <p>{order.shippingAddress}, {order.city}</p>
        </div>
      </div>

      <div className="mt-8 flex justify-center gap-3">
        <Button render={<Link href="/" />} nativeButton={false}>
          Continue shopping
        </Button>
        <ReorderButton items={reorderItems} />
      </div>
    </div>
  );
}
