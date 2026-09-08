"use client";

import { useEffectiveStock } from "@/lib/use-effective-stock";
import { cn } from "@/lib/utils";

// At or below this many units, the badge switches from a neutral "in
// stock" note to an urgent "X left" one.
const LOW_STOCK_THRESHOLD = 5;

/**
 * Live "22 in stock" / "Only 2 left!" line for a product. Reads through
 * useEffectiveStock so it reflects this browser's own simulated purchases
 * (see lib/simulated-stock.ts), not just the raw DB stock count.
 */
export default function StockBadge({
  productId,
  stock,
  className,
}: {
  productId: string;
  stock: number;
  className?: string;
}) {
  const effectiveStock = useEffectiveStock(productId, stock);

  if (effectiveStock <= 0) {
    return (
      <span className={cn("text-xs font-medium text-muted-foreground", className)}>
        Out of stock
      </span>
    );
  }

  if (effectiveStock <= LOW_STOCK_THRESHOLD) {
    return (
      <span
        className={cn(
          "text-xs font-semibold text-red-600 dark:text-red-400",
          className
        )}
      >
        Only {effectiveStock} {effectiveStock === 1 ? "item" : "items"} left in stock!
      </span>
    );
  }

  return (
    <span className={cn("text-xs text-muted-foreground", className)}>
      {effectiveStock} items in stock
    </span>
  );
}
