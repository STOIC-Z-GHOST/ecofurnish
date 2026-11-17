import { desc } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { formatPrice } from "@/lib/currency";
import { OrderStatusSelect } from "@/components/admin/order-status-select";
import { TrackingNoteInput } from "@/components/admin/tracking-note-input";
import { Badge } from "@/components/ui/badge";
import { requireAdminViewPage } from "@/lib/require-admin";
import { maskEmail, maskName } from "@/lib/mask";
import { SandboxOrdersTable } from "@/components/admin/sandbox/SandboxOrdersTable";

export default async function AdminOrdersPage() {
  const { isGuest } = await requireAdminViewPage();
  const rows = await db.select().from(orders).orderBy(desc(orders.createdAt));

  // A read-only guest gets the table with customer details masked HERE, on
  // the server (the real values never reach their browser) and no tracking
  // notes (free text that can hold a phone number or address). Status and
  // tracking can be "changed" for them, but only in their own browser.
  if (isGuest) {
    return (
      <div>
        <h2 className="mb-6 text-lg font-semibold">Orders ({rows.length})</h2>
        {rows.length === 0 ? (
          <p className="text-muted-foreground">No orders placed yet.</p>
        ) : (
          <SandboxOrdersTable
            rows={rows.map((o) => ({
              id: o.id,
              customerName: maskName(o.customerName),
              customerEmail: maskEmail(o.customerEmail),
              createdAtIso: o.createdAt.toISOString(),
              totalAmount: o.totalAmount,
              paymentStatus: o.paymentStatus,
              status: o.status,
            }))}
          />
        )}
      </div>
    );
  }

  const allOrders = rows;

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
