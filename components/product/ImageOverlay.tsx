import { hasActiveDiscount } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import { Product } from "@/types/product";
import CountdownTimer from "./CountdownTimer";

/**
 * What still sits ON the product picture: the flash-sale countdown, and
 * nothing else. The kg Diverted pill is top left (see ProductImage). The
 * low-stock warning and the star rating used to float over the photo too,
 * which looked cluttered, so they now sit as plain text under the price
 * (see ProductInfo).
 *
 * Renders an empty, invisible box when there is nothing to show.
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
      {discounted && product.dealEndsAt && <CountdownTimer endsAt={product.dealEndsAt} compact />}
    </div>
  );
}
