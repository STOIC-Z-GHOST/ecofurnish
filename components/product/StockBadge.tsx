"use client";

import { AlertTriangle } from "lucide-react";
import { useEffectiveStock } from "@/lib/use-effective-stock";
import { cn } from "@/lib/utils";
import RestockCountdown from "./RestockCountdown";

// At or below this many units, the badge switches from a neutral "in
// stock" note to a red warning badge.
const LOW_STOCK_THRESHOLD = 5;

/**
 * Live stock line for a product — "22 items in stock", a red warning badge
 * when it's nearly gone, or "Out of stock" with a "Back in stock in…"
 * countdown when there's a restock time to show. Reads through
 * useEffectiveStock so it reflects this browser's own simulated purchases
 * (see lib/simulated-stock.ts), not just the raw DB stock count. This one
 * component is used on the product cards, the hover preview and the
 * product page, so a change here shows up on all of them.
 */
export default function StockBadge({
  productId,
  stock,
  restockAt,
  className,
}: {
  productId: string;
  stock: number;
  restockAt?: Date | string | null;
  className?: string;
}) {
  const effectiveStock = useEffectiveStock(productId, stock);

  if (effectiveStock <= 0) {
    return (
      <span className={cn("inline-flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs", className)}>
        <span className="font-semibold text-red-600 dark:text-red-400">Out of stock</span>
        <RestockCountdown productId={productId} stock={stock} restockAt={restockAt} />
      </span>
    );
  }

  if (effectiveStock <= LOW_STOCK_THRESHOLD) {
    return (
      <span
        className={cn(
          "inline-flex w-fit items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white",
          className
        )}
      >
        <AlertTriangle
          className={cn("h-3 w-3 shrink-0", effectiveStock <= 2 && "animate-pulse")}
          aria-hidden="true"
        />
        Only {effectiveStock} left!
      </span>
    );
  }

  return (
    <span className={cn("text-xs text-muted-foreground", className)}>
      {effectiveStock} items in stock
    </span>
  );
}
