import Image from "next/image";
import { Leaf } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/types/product";
import { cn } from "@/lib/utils";
import ImageOverlay from "./ImageOverlay";
import RestockOverlay from "./RestockOverlay";

export default function ProductImage({
  product,
  row = false,
}: {
  product: Product;
  /** Phone shop list: a fixed square on the left, spanning the whole row. */
  row?: boolean;
}) {
  const displayImage = product.imageUrl || "/placeholder.jpg"; // Fallback image

  return (
    // Always a 1:1 square on a plain white box, so photos with different
    // shapes and backgrounds still look like one set.
    <div
      className={cn(
        "relative aspect-square overflow-hidden bg-white",
        row && "row-span-3 self-start md:row-auto md:self-auto"
      )}
    >
      <Image
        src={displayImage}
        alt={product.name}
        fill
        className="object-contain"
        sizes="(max-width: 767px) 50vw, (max-width: 1024px) 33vw, 25vw"
      />
      {/* Sold out: dark frosted layer with turning arrows + countdown. Sits
          right after the photo so the badges below stay on top of it. */}
      <RestockOverlay productId={product.id} stock={product.stock} restockAt={product.restockAt} />

      {/* The one badge left on the picture: kg of plastic diverted, top left. */}
      <Badge className="absolute left-2 top-2 flex items-center gap-1 bg-emerald-700 px-1.5 py-0.5 text-[0.65rem] text-white hover:bg-emerald-800 sm:left-3 sm:top-3 sm:px-2 sm:py-0.5 sm:text-xs">
        <Leaf className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
        {product.plasticWeightKg}kg Diverted
      </Badge>

      {/* Flash-sale countdown only. Stock and rating moved under the price. */}
      <ImageOverlay product={product} />
    </div>
  );
}
