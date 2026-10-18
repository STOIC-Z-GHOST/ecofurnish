import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatPrice, type Currency } from "@/lib/currency";
import { getEffectivePrice, hasActiveDiscount } from "@/lib/pricing";
import { Product } from "@/types/product";

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
      <CardHeader className="p-3 pb-1.5 sm:p-4 sm:pb-1.5">
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
        {/* The stock, "% off" and star-rating badges all live on the
            picture now (see ProductImage) — the card used to reserve
            invisible rows for them so every card came out the same
            height, which left a big empty gap in any card without them.
            The description block below is still a fixed two lines tall,
            and the card stretches to fill its grid row. */}
      </CardHeader>

      <CardContent className="grow p-3 pt-0 sm:p-4 sm:pb-3 sm:pt-0">
        {/* min-h-10 = 2 lines at text-sm's line-height — line-clamp-2 only
            caps the *maximum*, so a short one-line blurb was otherwise
            leaving this card shorter than a neighbor with a wrapped
            two-line one. */}
        <p className="line-clamp-2 min-h-10 select-text text-sm text-muted-foreground">
          {product.description || "Sustainable furniture crafted from recycled materials."}
        </p>
      </CardContent>
    </>
  );
}
