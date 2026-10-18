import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatPrice, type Currency } from "@/lib/currency";
import { getEffectivePrice } from "@/lib/pricing";
import { Product } from "@/types/product";
import DiscountLine from "./DiscountLine";

export default function ProductInfo({
  product,
  currency = "ETB",
}: {
  product: Product;
  currency?: Currency;
}) {
  return (
    <>
      <CardHeader className="p-3 pb-1.5 sm:p-4 sm:pb-1.5">
        <div className="flex items-start justify-between gap-2 sm:gap-4">
          <CardTitle className="line-clamp-1 select-text text-base sm:text-lg">
            {product.name}
          </CardTitle>
          <span className="whitespace-nowrap text-base font-bold text-primary sm:text-lg">
            {formatPrice(getEffectivePrice(product), currency)}
          </span>
        </div>
        {/* "20% off  $46.07" under the new price. The line keeps its height
            on cards with no discount too (reserve), so the description
            starts at the same distance below the name on every card in the
            row. The discount's reason only shows on the product page. */}
        <DiscountLine product={product} currency={currency} reserve />
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
