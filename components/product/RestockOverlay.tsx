"use client";

import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRemaining, useRestockTarget } from "./RestockCountdown";

/**
 * The "restocking" treatment for a sold-out product picture.
 *
 *  variant="card" (default): a frosted layer over the WHOLE picture — a light
 *  blur and dim so you can still see what it is — with slowly turning arrows
 *  and the countdown in the middle. Used on the catalog cards and the hover
 *  preview, where the picture is small and the message is the point.
 *
 *  variant="badge": just a small pill at the bottom of the picture, no blur.
 *  Used on the product page, where people want to look at the big photo.
 *
 * Shows nothing while the visitor can still buy the product. When it's sold
 * out but there's no restock time to count down to, the arrows are left out
 * (no promising a restock that isn't scheduled) and it's only the frosted
 * layer. Never intercepts clicks, so the card/photo underneath keeps working.
 *
 * Put it right after the <Image> and BEFORE the other badges so they stay on
 * top of it. Motion is turned off for people who prefer reduced motion.
 */
export default function RestockOverlay({
  productId,
  stock,
  restockAt,
  variant = "card",
  className,
}: {
  productId: string;
  stock: number; // the real, admin-set stock
  restockAt?: Date | string | null;
  variant?: "card" | "badge";
  className?: string;
}) {
  const { effectiveStock, target, remaining } = useRestockTarget(productId, stock, restockAt);
  if (effectiveStock > 0) return null;

  // A time is set (even if it has just passed and the refill hasn't landed
  // yet) -> a restock is on its way.
  const restocking = target !== null;
  const countdown = remaining > 0 ? formatRemaining(remaining) : null;
  const label = restocking
    ? countdown
      ? `Restocking, back in ${countdown}`
      : "Restocking now"
    : "Out of stock";

  if (variant === "badge") {
    return (
      <div
        role="status"
        aria-label={label}
        className={cn(
          "pointer-events-none absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-black/60 px-3.5 py-1.5 text-sm font-medium text-white shadow-sm ring-1 ring-white/20 backdrop-blur-md",
          className
        )}
      >
        {restocking && (
          <RefreshCw
            className="h-4 w-4 shrink-0 text-emerald-300 motion-safe:animate-spin [animation-duration:2.6s]"
            aria-hidden="true"
          />
        )}
        {restocking ? "Restocking" : "Out of stock"}
        {countdown && <span className="tabular-nums text-amber-200">· {countdown}</span>}
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-label={label}
      className={cn(
        "pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-background/55 text-center backdrop-blur-[3px]",
        className
      )}
    >
      {restocking && (
        <>
          <RefreshCw
            className="h-8 w-8 text-emerald-700 motion-safe:animate-spin [animation-duration:2.6s] sm:h-10 sm:w-10 dark:text-emerald-400"
            aria-hidden="true"
          />
          <span className="text-xs font-semibold text-foreground sm:text-sm">Restocking</span>
          {countdown && (
            <span className="text-xs font-medium tabular-nums text-muted-foreground">
              Back in {countdown}
            </span>
          )}
        </>
      )}
    </div>
  );
}
