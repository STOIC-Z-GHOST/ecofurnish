import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatPrice, type Currency } from "@/lib/currency";
import { getEffectivePrice } from "@/lib/pricing";
import { Product } from "@/types/product";
import { cn } from "@/lib/utils";
import CardRating from "./CardRating";
import DiscountLine from "./DiscountLine";
import StockBadge from "./StockBadge";

/**
 * Order of things, top to bottom, the same on every card: full product name
 * (it wraps, never cut off), rating, price (with the old price next to it
 * when discounted), a red "Almost gone" line when stock is low, and, from
 * the sm breakpoint up, a three-line description.
 */
export default function ProductInfo({
  product,
  currency = "ETB",
  row = false,
}: {
  product: Product;
  currency?: Currency;
  row?: boolean;
}) {
  return (
    <>
      <CardHeader className={cn("gap-0 p-3 pb-0 sm:p-5 sm:pb-0", row && "pl-4 sm:pl-5 md:pl-5")}>
        <CardTitle className="select-text font-sans text-sm leading-snug font-medium sm:text-base md:min-h-11">
          {product.name}
        </CardTitle>

        <CardRating
          rating={product.avgRating}
          count={product.reviewCount}
          className="mt-1.5"
        />

        <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="whitespace-nowrap text-base font-bold text-primary sm:text-lg">
            {formatPrice(getEffectivePrice(product), currency)}
          </span>
          <DiscountLine product={product} currency={currency} className="h-auto justify-start" />
        </div>

        {/* Keeps its height on desktop so descriptions start at the same
            spot on every card in a row, even when only some are low. */}
        <div className="mt-1 md:min-h-4">
          <StockBadge
            productId={product.id}
            stock={product.stock}
            restockAt={product.restockAt}
            variant="line"
          />
        </div>
      </CardHeader>

      <CardContent
        className={cn(
          "hidden grow p-3 pt-2 sm:block sm:p-5 sm:pb-3 sm:pt-2",
          row && "md:col-auto"
        )}
      >
        {/* min-h-15 = 3 lines at text-sm's line-height, so a short blurb
            doesn't leave this card shorter than a neighbour with a long one. */}
        <p className="line-clamp-3 min-h-15 select-text text-sm leading-5 text-muted-foreground">
          {product.description || "Sustainable furniture crafted from recycled materials."}
        </p>
      </CardContent>
    </>
  );
}
