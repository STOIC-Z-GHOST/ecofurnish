import { desc, inArray } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { orderItems, orders } from "@/db/schema";
import { formatPrice } from "@/lib/currency";
import { OrderStatusSelect } from "@/components/admin/order-status-select";
import { TrackingNoteInput } from "@/components/admin/tracking-note-input";
import { Badge } from "@/components/ui/badge";
import { requireAdminViewPage } from "@/lib/require-admin";
import { DEMO_ORDERS } from "@/lib/demo-data";
import { SandboxOrdersTable } from "@/components/admin/sandbox/SandboxOrdersTable";

export default async function AdminOrdersPage() {
  const { isGuest } = await requireAdminViewPage("guestOrders");

  // A read-only guest gets a table of MADE-UP orders: the database is not
  // queried for them at all, so no real customer detail can reach their
  // browser. Status and tracking can be "changed" for them, but only in
  // their own browser.
  if (isGuest) {
    return (
      <div>
        <h2 className="mb-6 text-lg font-semibold">Orders ({DEMO_ORDERS.length})</h2>
        <SandboxOrdersTable rows={DEMO_ORDERS} />
      </div>
    );
  }

  const rows = await db.select().from(orders).orderBy(desc(orders.createdAt));
  const allOrders = rows;

  // What each order actually contains — including the color/size the customer
  // chose — so nobody has to open every order to know what to prepare.
  const itemRows =
    allOrders.length > 0
      ? await db
          .select()
          .from(orderItems)
          .where(inArray(orderItems.orderId, allOrders.map((o) => o.id)))
      : [];
  const itemsByOrder = new Map<string, typeof itemRows>();
  for (const item of itemRows) {
    const list = itemsByOrder.get(item.orderId) ?? [];
    list.push(item);
    itemsByOrder.set(item.orderId, list);
  }

  return (
    <div>
      <h2 className="mb-6 text-lg font-semibold">Orders ({allOrders.length})</h2>

      {allOrders.length === 0 ? (
        <p className="text-muted-foreground">No orders placed yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border/60">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-muted-foreground">
              <tr>
                <th className="p-3">Order</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Items</th>
                <th className="p-3">Date</th>
                <th className="p-3">Total</th>
                <th className="p-3">Payment</th>
                <th className="p-3">Status</th>
                <th className="p-3">Tracking</th>
              </tr>
            </thead>
            <tbody>
              {allOrders.map((order) => (
                <tr key={order.id} className="border-t border-border/60">
                  <td className="p-3">
                    <Link
                      href={`/order-confirmation/${order.id}`}
                      className="font-mono hover:underline"
                    >
                      #{order.id.slice(0, 8)}
                    </Link>
                  </td>
                  <td className="p-3">
                    <div>{order.customerName}</div>
                    <div className="text-xs text-muted-foreground">{order.customerEmail}</div>
                  </td>
                  <td className="p-3">
                    <ul className="space-y-0.5">
                      {(itemsByOrder.get(order.id) ?? []).map((item) => (
                        <li key={item.id} className="text-xs">
                          <span className="font-medium">{item.quantity}×</span> {item.productName}
                          {item.variantLabel && (
                            <span className="ml-1 rounded bg-primary/10 px-1.5 py-0.5 font-medium text-primary">
                              {item.variantLabel}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-3 font-medium">{formatPrice(order.totalAmount, "ETB")}</td>
                  <td className="p-3">
                    <Badge variant={order.paymentStatus === "paid" ? "default" : "outline"}>
                      {order.paymentStatus}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <OrderStatusSelect orderId={order.id} status={order.status} />
                  </td>
                  <td className="p-3">
                    <TrackingNoteInput orderId={order.id} trackingNote={order.trackingNote} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
