import { desc } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { formatPrice } from "@/lib/currency";
import { OrderStatusSelect } from "@/components/admin/order-status-select";
import { TrackingNoteInput } from "@/components/admin/tracking-note-input";
import { Badge } from "@/components/ui/badge";
import { requireAdminPage } from "@/lib/require-admin";

export default async function AdminOrdersPage() {
  await requireAdminPage();
  const allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt));

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
