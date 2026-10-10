"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Clock } from "lucide-react";
import { notifyStockChanged, useEffectiveStock } from "@/lib/use-effective-stock";
import { getSimulatedRestockAt } from "@/lib/simulated-stock";
import { cn } from "@/lib/utils";

// A once-a-second clock that, like useEffectiveStock, is 0 on the server
// and during hydration (so the markup matches) and real afterwards.
function subscribeToClock(onChange: () => void) {
  const id = setInterval(onChange, 1000);
  return () => clearInterval(id);
}
function useNowSeconds(): number {
  return useSyncExternalStore(
    subscribeToClock,
    () => Math.floor(Date.now() / 1000),
    () => 0
  );
}

function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  // Days when it's far off; the ticking H:MM:SS once it's within a day.
  if (days > 0) return `${days}d ${pad(hours)}h ${pad(minutes)}m`;
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/**
 * "Back in stock in 02:14:09" — shown only while the product is sold out
 * for THIS visitor, and only when there's a time to count down to:
 *
 *  - The product is out of stock for everyone (real stock is 0): counts
 *    down to the restock time an admin set on the product, if any.
 *  - The product has stock, but THIS browser's own demo purchases used it
 *    up: counts down to when that temporary tally resets. Nobody else sees
 *    this, because for them the product isn't sold out.
 *
 * Renders nothing otherwise.
 */
export default function RestockCountdown({
  productId,
  stock,
  restockAt,
  className,
}: {
  productId: string;
  stock: number; // the real, admin-set stock
  restockAt?: Date | string | null;
  className?: string;
}) {
  const effectiveStock = useEffectiveStock(productId, stock);
  const nowSeconds = useNowSeconds();

  let target: number | null = null;
  if (effectiveStock <= 0 && nowSeconds > 0) {
    if (stock <= 0) {
      const adminTime = restockAt ? new Date(restockAt).getTime() : NaN;
      target = Number.isFinite(adminTime) ? adminTime : null;
    } else {
      target = getSimulatedRestockAt(productId);
    }
  }

  // When a browser's temporary sold-out period ends, tell every stock
  // display on the page (the Add to Cart button, the badge) straight away
  // rather than leaving them to notice on their next periodic check.
  const resetsOnItsOwn = stock > 0;
  useEffect(() => {
    if (target === null || !resetsOnItsOwn) return;
    const id = setTimeout(notifyStockChanged, Math.max(0, target - Date.now()) + 50);
    return () => clearTimeout(id);
  }, [target, resetsOnItsOwn]);

  const remaining = target === null ? 0 : target - nowSeconds * 1000;
  if (target === null || remaining <= 0) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium tabular-nums text-amber-700 dark:text-amber-400",
        className
      )}
    >
      <Clock className="h-3 w-3 shrink-0" aria-hidden="true" />
      Back in stock in {formatRemaining(remaining)}
    </span>
  );
}
