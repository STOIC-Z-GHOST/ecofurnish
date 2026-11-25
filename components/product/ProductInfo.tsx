import { formatPrice, type Currency } from "@/lib/currency";
import { getEffectivePrice } from "@/lib/pricing";
import { Product } from "@/types/product";
import DiscountLine from "./DiscountLine";
import StockBadge from "./StockBadge";

/**
 * Text block of a product card, Amazon style: full name (it wraps, it is
 * never cut off), price under it, a red "Almost gone" line under the price,
 * and on larger screens a three-line description. The description area
 * grows, so the Add to Cart buttons below line up across a row of cards.
 */
export default function ProductInfo({
  product,
  currency = "ETB",
}: {
  product: Product;
  currency?: Currency;
}) {
  return (
    <div className="flex flex-1 flex-col gap-1.5 p-3 pb-2 md:gap-2 md:p-5 md:pb-3">
      <h3 className="select-text font-sans text-sm leading-snug font-medium text-foreground md:min-h-[2.75em] md:text-base">
        {product.name}
      </h3>

      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className="text-base font-bold text-primary md:text-lg">
          {formatPrice(getEffectivePrice(product), currency)}
        </span>
        <DiscountLine product={product} currency={currency} className="h-auto justify-start" />
      </div>

      <StockBadge
        productId={product.id}
        stock={product.stock}
        restockAt={product.restockAt}
        variant="line"
      />

      <p className="line-clamp-3 select-text text-sm leading-relaxed text-muted-foreground max-md:hidden">
        {product.description || "Sustainable furniture crafted from recycled materials."}
      </p>
    </div>
  );
}
