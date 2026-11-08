import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { PackageSearch } from "lucide-react";
import { db } from "@/db";
import { orderPayments, orders } from "@/db/schema";
import { chapaReceiptLinksEnabled, chapaReceiptUrl } from "@/lib/payments";
import { auth } from "@/lib/auth";
import { formatPrice, type Currency } from "@/lib/currency";
import { getFreshRates } from "@/lib/fx-rates";
import { Badge } from "@/components/ui/badge";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  processing: "Processing",
  ready_for_delivery: "Ready for Delivery",
  on_the_road: "On the Road",
  near_destination: "Near You",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default async function OrderHistoryPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/sign-in");

  const myOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, session.user.id))
    .orderBy(desc(orders.createdAt));

  // Chapa receipt details per order. Looked up on its own and defensively so
  // the order list still loads if receipts aren't set up yet.
  const paymentByOrder = new Map<string, { reference: string; method: string | null }>();
  try {
    const rows = await db
      .select({
        orderId: orderPayments.orderId,
        reference: orderPayments.chapaReference,
        method: orderPayments.method,
      })
      .from(orderPayments)
      .innerJoin(orders, eq(orders.id, orderPayments.orderId))
      .where(eq(orders.userId, session.user.id));
    for (const r of rows) paymentByOrder.set(r.orderId, { reference: r.reference, method: r.method });
  } catch (error) {
    console.error("Couldn't load payment receipts:", error);
  }

  const preferredCurrency = (session.user.preferredCurrency as Currency | undefined) || "ETB";
  // Awaited explicitly (rather than relying on the shared EXCHANGE_RATES
  // object already being warm) since this is a Server Component — it
  // has its own module instance, separate from the browser's, so it
  // needs its own fresh copy rather than assuming one exists yet.
  const { rates } = await getFreshRates();

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-8 text-3xl font-extrabold tracking-tight">Orders &amp; Payments</h1>

      {myOrders.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed bg-muted/20 py-24 text-center">
          <PackageSearch className="mx-auto h-8 w-8 text-muted-foreground" />
          <h2 className="mt-4 text-xl font-semibold">No orders yet</h2>
          <p className="mt-1 text-muted-foreground">
            Orders you place while signed in will show up here.
          </p>
          <Link href="/" className="mt-4 inline-block font-medium text-primary hover:underline">
            Start shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {myOrders.map((order) => {
            const payment = paymentByOrder.get(order.id);
            const receiptUrl = payment && chapaReceiptLinksEnabled() ? chapaReceiptUrl(payment.reference) : null;
            const wasPaid = ["paid", "refunded", "refund_pending", "credited"].includes(order.paymentStatus);
            return (
              <div
                key={order.id}
                className="rounded-lg border border-border/60 transition-colors hover:bg-muted/30"
              >
                <Link
                  href={`/order-confirmation/${order.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 p-4"
                >
                  <div>
                    <p className="font-mono text-sm text-muted-foreground">
                      #{order.id.slice(0, 8)}
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={order.paymentStatus === "paid" ? "default" : "outline"}>
                      {order.paymentStatus}
                    </Badge>
                    <Badge variant="outline">{STATUS_LABELS[order.status] ?? order.status}</Badge>
                  </div>
                  <span className="font-semibold text-primary">
                    {formatPrice(order.totalAmount, preferredCurrency, rates)}
                  </span>
                </Link>
                {wasPaid && (
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border/60 px-4 py-2 text-xs text-muted-foreground">
                    {payment && (
                      <span>
                        {payment.method ? `Paid via ${payment.method} · ` : "Paid · "}ref {payment.reference}
                      </span>
                    )}
                    {receiptUrl && (
                      <a
                        href={receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-primary hover:underline"
                      >
                        Chapa receipt
                      </a>
                    )}
                    <Link
                      href={`/order-confirmation/${order.id}#receipt`}
                      className="font-medium text-primary hover:underline"
                    >
                      Receipt details
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
