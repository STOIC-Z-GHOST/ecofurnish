import { formatPrice, type Currency } from "@/lib/currency";
import { hasActiveDiscount } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import { Product } from "@/types/product";

/**
 * The line under a card's price: "20% off  $46.07" (percentage pill, then
 * the crossed-out old price), right-aligned under the new price.
 *
 * `reserve` keeps the line's height even when there's no discount, so every
 * card in a row has the same title-to-description distance. The hover
 * preview doesn't need that and leaves it out.
 *
 * The discount's *reason* is deliberately not shown here — it only appears
 * on the product page (see ProductPrice).
 */
export default function DiscountLine({
  product,
  currency,
  reserve = false,
  className,
}: {
  product: Product;
  currency: Currency;
  reserve?: boolean;
  className?: string;
}) {
  if (!hasActiveDiscount(product)) {
    return reserve ? <div aria-hidden="true" className={cn("h-[1.125rem]", className)} /> : null;
  }

  return (
    <div
      className={cn(
        "flex h-[1.125rem] items-center justify-end gap-1.5 whitespace-nowrap",
        className
      )}
    >
      <span className="rounded-full bg-emerald-700 px-1.5 text-[0.65rem] leading-4 font-semibold text-white">
        {product.discountPercent}% off
      </span>
      <span className="text-xs text-muted-foreground line-through">
        {formatPrice(product.price, currency)}
      </span>
    </div>
  );
}
