"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Hourglass } from "lucide-react";
import { getWaitingOrderItems } from "@/app/actions/orders";

type WaitingItem = Awaited<ReturnType<typeof getWaitingOrderItems>>[number];

/**
 * Items the customer has already paid for that sold out at the last moment
 * (see the sold-out flow in app/actions/orders.ts), shown dimmed above the
 * cart until they're back. They're paid orders, not cart items — so they
 * live here as a read-only reminder with a link to the order, never in the
 * editable cart where they could be paid for twice.
 */
export function WaitingForRestock() {
  const [items, setItems] = useState<WaitingItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    getWaitingOrderItems()
      .then((rows) => {
        if (!cancelled) setItems(rows);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (items.length === 0) return null;

  return (
    <section className="mb-8 rounded-xl border border-dashed border-border bg-muted/30 p-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <Hourglass className="h-4 w-4" /> Waiting for restock
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Already paid for — the price is locked, and we&apos;ll email you when it&apos;s confirmed.
      </p>
      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <Link
            key={`${item.orderId}-${item.productId}`}
            href={`/order-confirmation/${item.orderId}`}
            className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted/60"
          >
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-muted">
              <Image
                src={item.imageUrl || "/placeholder.jpg"}
                alt=""
                fill
                className="object-cover blur-[3px] grayscale"
                sizes="56px"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-1 text-sm font-medium text-muted-foreground">
                {item.quantity} × {item.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {item.state === "choose" ? "Choose what to do" : "Waiting for restock"}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
