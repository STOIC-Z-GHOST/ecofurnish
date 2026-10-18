import Image from "next/image";
import { Leaf } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/types/product";
import ImageOverlay from "./ImageOverlay";

export default function ProductImage({ product }: { product: Product }) {
  const displayImage = product.imageUrl || "/placeholder.jpg"; // Fallback image

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

      {/* Stock warning, "% off" and star rating — see ImageOverlay. */}
      <ImageOverlay product={product} />
    </div>
  );
}
