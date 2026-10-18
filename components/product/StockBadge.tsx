"use client";

import { Flame } from "lucide-react";
import { useEffectiveStock } from "@/lib/use-effective-stock";
import { cn } from "@/lib/utils";
import RestockCountdown from "./RestockCountdown";

// At or below this many units, the badge switches from a neutral "in
// stock" note to a red "selling fast" badge.
const LOW_STOCK_THRESHOLD = 5;

// The wording of that badge — change the text here and it updates on the
// product cards, the hover preview and the product page. Keep it short: it
// has to fit on one line inside a narrow product card.
function lowStockMessage(left: number): string {
  return left === 1 ? "Last one — grab it!" : `Almost gone — ${left} left`;
}

/**
 * Live stock line for a product — "22 items in stock", a red "Almost gone"
 * badge when it's nearly gone, or "Out of stock" with a "Back in stock in…"
 * countdown when there's a restock time to show. Reads through
 * useEffectiveStock so it reflects this browser's own simulated purchases
 * (see lib/simulated-stock.ts), not just the raw DB stock count.
 *
 * variant="inline" (default) is the text version used on the hover preview
 * and the product page. variant="overlay" is the version that sits ON the
 * product picture on the cards: it only appears when there's something
 * worth flagging (sold out or nearly gone), and shows nothing for a product
 * that's simply in stock, so those cards aren't left with an empty row.
 */
export default function StockBadge({
  productId,
  stock,
  restockAt,
  className,
  variant = "inline",
}: {
  productId: string;
  stock: number;
  restockAt?: Date | string | null;
  className?: string;
  variant?: "inline" | "overlay";
}) {
  const effectiveStock = useEffectiveStock(productId, stock);
  const overlay = variant === "overlay";

  if (effectiveStock <= 0) {
    if (overlay) {
      return (
        <span
          className={cn(
            "inline-flex max-w-full flex-col items-start gap-0.5 rounded-lg bg-black/60 px-2.5 py-1 text-xs font-semibold text-white shadow-sm ring-1 ring-white/20 backdrop-blur-md",
            className
          )}
        >
          <span>Out of stock</span>
          <RestockCountdown productId={productId} stock={stock} restockAt={restockAt} compact />
        </span>
      );
    }
    return (
      <span className={cn("inline-flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs", className)}>
        <span className="font-semibold text-red-600 dark:text-red-400">Out of stock</span>
        <RestockCountdown productId={productId} stock={stock} restockAt={restockAt} />
      </span>
    );
  }

  if (effectiveStock <= LOW_STOCK_THRESHOLD) {
    // The outer span takes whatever layout classes the caller passes; the
    // inner span keeps the icon and text on ONE line no matter what the
    // outer one is doing — without it, a narrow card could wrap the icon
    // above the text.
    return (
      <span className={cn("w-fit", className)}>
        <span
          className={cn(
            "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold text-white",
            // On the picture: frosted dark glass instead of a solid red slab;
            // the flame keeps the red cue. Elsewhere: the plain red badge.
            overlay
              ? "bg-black/55 shadow-sm ring-1 ring-white/20 backdrop-blur-md"
              : "bg-red-600"
          )}
        >
          <Flame
            className={cn(
              "h-3 w-3 shrink-0",
              overlay && "text-red-400",
              effectiveStock <= 2 && "animate-pulse"
            )}
            aria-hidden="true"
          />
          {lowStockMessage(effectiveStock)}
        </span>
      </span>
    );
  }

  if (overlay) return null;

  return (
    <span className={cn("text-xs text-muted-foreground", className)}>
      {effectiveStock} items in stock
    </span>
  );
}
