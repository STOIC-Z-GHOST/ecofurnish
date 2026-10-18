import { hasActiveDiscount } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import { Product } from "@/types/product";
import CountdownTimer from "./CountdownTimer";
import RatingBadge from "./RatingBadge";
import StockBadge from "./StockBadge";

/**
 * The badges that sit ON the product picture — stock warning, "% off"
 * (with its countdown) and the star-rating pill. One component so the
 * catalog card and its hover preview show them in exactly the same place:
 * hovering a card used to move the stock warning down into the text, which
 * made the whole card jump. They only appear as plain inline text on the
 * product page itself (see ProductSummary).
 *
 * Anchored to the bottom and allowed to wrap, so on a narrow phone card the
 * badges stack upward rather than running into the eco pill above. Renders
 * an empty, invisible box when there is nothing to flag.
 */
export default function ImageOverlay({
  product,
  className,
}: {
  product: Product;
  className?: string;
}) {
  const discounted = hasActiveDiscount(product);

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-x-2 bottom-2 flex flex-wrap items-end gap-1 sm:inset-x-3 sm:bottom-3",
        className
      )}
    >
      <StockBadge
        productId={product.id}
        stock={product.stock}
        restockAt={product.restockAt}
        variant="overlay"
      />
      {discounted && (
        <>
          <span className="inline-block w-fit rounded-full bg-emerald-700 px-2 py-0.5 text-xs font-semibold text-white shadow-sm">
            {product.discountPercent}% off
          </span>
          {product.dealEndsAt && <CountdownTimer endsAt={product.dealEndsAt} compact />}
        </>
      )}
      {/* ml-auto pins the rating to the right edge, opposite the stock
          badge; if the left side fills the row it wraps onto its own line,
          still at the bottom right. */}
      <RatingBadge rating={product.avgRating} count={product.reviewCount} className="ml-auto" />
    </div>
  );
}
