import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatPrice, type Currency } from "@/lib/currency";
import { getEffectivePrice, hasActiveDiscount } from "@/lib/pricing";
import { Product } from "@/types/product";
import ProductRating from "./ProductRating";
import CountdownTimer from "./CountdownTimer";
import StockBadge from "./StockBadge";

export default function ProductInfo({
  product,
  currency = "ETB",
}: {
  product: Product;
  currency?: Currency;
}) {
  const discounted = hasActiveDiscount(product);

  return (
    <>
      <CardHeader className="p-3 pb-2 sm:p-4">
        <div className="flex items-start justify-between gap-2 sm:gap-4">
          <CardTitle className="line-clamp-1 select-text text-base sm:text-lg">
            {product.name}
          </CardTitle>
          {discounted ? (
            <div className="flex flex-col items-end whitespace-nowrap">
              <span className="text-base font-bold text-primary sm:text-lg">
                {formatPrice(getEffectivePrice(product), currency)}
              </span>
              <span className="text-xs text-muted-foreground line-through">
                {formatPrice(product.price, currency)}
              </span>
            </div>
          ) : (
            <span className="whitespace-nowrap text-base font-bold text-primary sm:text-lg">
              {formatPrice(product.price, currency)}
            </span>
          )}
        </div>
        {/* Always rendered — a discounted card's badge row used to be the
            only thing making that card's natural height differ from its
            row-mates, which (now that cards stretch to match the tallest
            one in a row) showed up as a big empty gap in the shorter
            cards. Reserving the same row height either way means every
            card is close to the same natural height to begin with, so
            there's little left to stretch. */}
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {discounted ? (
            <>
              <span className="inline-block w-fit rounded-full bg-emerald-700 px-2 py-0.5 text-xs font-semibold text-white">
                {product.discountPercent}% off
              </span>
              {product.dealEndsAt && <CountdownTimer endsAt={product.dealEndsAt} compact />}
            </>
          ) : (
            <span
              className="invisible inline-block w-fit rounded-full px-2 py-0.5 text-xs font-semibold"
              aria-hidden="true"
            >
              placeholder
            </span>
          )}
        </div>
        {/* Same reasoning as the badge row above — a rated product is one
            row taller than an unrated one, which is the other thing that
            was still causing uneven natural heights. Rendering the same
            ProductRating markup either way (just invisible when there's
            no real rating yet) reserves identical space without needing
            a hand-built placeholder. */}
        <div
          className={product.avgRating != null && product.reviewCount ? undefined : "invisible"}
          aria-hidden={product.avgRating != null && product.reviewCount ? undefined : true}
        >
          <ProductRating rating={product.avgRating ?? 0} count={product.reviewCount ?? 0} />
        </div>
      </CardHeader>

      <CardContent className="grow p-3 pt-0 sm:p-4 sm:pt-0">
        {/* min-h-10 = 2 lines at text-sm's line-height — line-clamp-2 only
            caps the *maximum*, so a short one-line blurb was otherwise
            leaving this card shorter than a neighbor with a wrapped
            two-line one. */}
        <p className="line-clamp-2 min-h-10 select-text text-sm text-muted-foreground">
          {product.description || "Sustainable furniture crafted from recycled materials."}
        </p>
        <StockBadge productId={product.id} stock={product.stock} className="mt-1.5 block" />
      </CardContent>
    </>
  );
}
