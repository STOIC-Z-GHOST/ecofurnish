import Image from "next/image";
import { Leaf } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { hasActiveDiscount } from "@/lib/pricing";
import { Product } from "@/types/product";
import CountdownTimer from "./CountdownTimer";
import StockBadge from "./StockBadge";
import RatingBadge from "./RatingBadge";

export default function ProductImage({ product }: { product: Product }) {
  const displayImage = product.imageUrl || "/placeholder.jpg"; // Fallback image
  const discounted = hasActiveDiscount(product);

  return (
    <div className="relative aspect-square overflow-hidden bg-muted">
      <Image
        src={displayImage}
        alt={product.name}
        fill
        className="object-contain transition-transform hover:scale-105"
        sizes="(max-width: 767px) 50vw, (max-width: 1024px) 33vw, 25vw"
      />
      {/* Eco-Impact Badge overlaid on the image */}
      <Badge className="absolute left-2 top-2 flex items-center gap-1 bg-emerald-700 px-1.5 py-0.5 text-[0.65rem] text-white hover:bg-emerald-800 sm:left-3 sm:top-3 sm:px-2 sm:py-0.5 sm:text-xs">
        <Leaf className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
        {product.plasticWeightKg}kg Diverted
      </Badge>

      {/* Stock + discount badges sit on the picture instead of taking up
          rows of their own under it — that's what used to leave a blank
          gap in every card that had neither. Anchored to the bottom and
          allowed to wrap, so on a narrow phone card they stack upward
          rather than running into the eco badge above. Cards with nothing
          to flag render nothing here. */}
      <div className="pointer-events-none absolute inset-x-2 bottom-2 flex flex-wrap items-end gap-1 sm:inset-x-3 sm:bottom-3">
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
        {/* Rating pill: bottom-right, opposite the eco pill. ml-auto pushes
            it to the right edge; if the badges on the left fill the row
            it wraps onto its own line, still at the bottom right. */}
        <RatingBadge rating={product.avgRating} count={product.reviewCount} className="ml-auto" />
      </div>
    </div>
  );
}
