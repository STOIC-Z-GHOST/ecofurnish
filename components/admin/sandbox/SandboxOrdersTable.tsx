"use client";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPrice } from "@/lib/currency";
import { ORDER_STATUSES } from "@/lib/order-statuses";
import { setSandboxOrder, useSandbox } from "@/lib/sandbox-store";

export type SandboxOrderRow = {
  id: string;
  customerName: string; // already masked on the server
  customerEmail: string; // already masked on the server
  createdAtIso: string;
  totalAmount: string;
  paymentStatus: string;
  status: string;
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  processing: "Processing",
  ready_for_delivery: "Ready for Delivery",
  on_the_road: "On the Road",
  near_destination: "Near Destination",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

/**
 * The Orders table for a read-only guest. The customer details arrive
 * already masked. Status and tracking note can be "changed", but only in
 * their own browser (see lib/sandbox-store.ts) — no server action is called.
 */
export function SandboxOrdersTable({ rows }: { rows: SandboxOrderRow[] }) {
  const sandbox = useSandbox();

  return (
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
          {rows.map((order) => {
            const edit = sandbox.orders[order.id];
            const status = edit?.status ?? order.status;
            return (
              <tr key={order.id} className="border-t border-border/60">
                <td className="p-3 font-mono">#{order.id.slice(0, 8)}</td>
                <td className="p-3">
                  <div>{order.customerName}</div>
                  <div className="text-xs text-muted-foreground">{order.customerEmail}</div>
                </td>
                <td className="p-3 text-muted-foreground">
                  {new Date(order.createdAtIso).toLocaleDateString()}
                </td>
                <td className="p-3 font-medium">{formatPrice(order.totalAmount, "ETB")}</td>
                <td className="p-3">
                  <Badge variant={order.paymentStatus === "paid" ? "default" : "outline"}>
                    {order.paymentStatus}
                  </Badge>
                </td>
                <td className="p-3">
                  <Select
                    value={status}
                    onValueChange={(next) => {
                      if (next) setSandboxOrder(order.id, { status: next });
                    }}
                  >
                    <SelectTrigger className="w-44">
                      <SelectValue>{STATUS_LABELS[status] ?? status}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {ORDER_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {STATUS_LABELS[s] ?? s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {edit?.status && edit.status !== order.status && (
                    <div className="mt-1 text-xs text-amber-700 dark:text-amber-400">changed · only you</div>
                  )}
                </td>
                <td className="p-3">
                  <Input
                    className="w-48"
                    placeholder="Add a tracking note…"
                    value={edit?.trackingNote ?? ""}
                    onChange={(e) => setSandboxOrder(order.id, { trackingNote: e.target.value })}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
