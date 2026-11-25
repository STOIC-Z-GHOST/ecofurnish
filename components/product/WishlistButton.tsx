"use client";

import { Heart } from "lucide-react";
import { useWishlist } from "@/lib/wishlist-context";
import { Product } from "@/types/product";
import { getEffectivePrice } from "@/lib/pricing";
import { cn } from "@/lib/utils";

/**
 * Plain outline heart, no box and no border. It fills with the brand green
 * once the product is on the wishlist. It sits on the white product picture,
 * so its colors are fixed rather than theme-dependent.
 */
export default function WishlistButton({
  product,
  className,
}: {
  product: Product;
  className?: string;
}) {
  const { isWishlisted, toggleItem } = useWishlist();
  const liked = isWishlisted(product.id);

  return (
    <button
      type="button"
      aria-label={liked ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={liked}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleItem({
          productId: product.id,
          name: product.name,
          price: getEffectivePrice(product),
          imageUrl: product.imageUrl,
          hasVariants: product.hasVariants,
        });
      }}
      className={cn(
        "flex size-9 items-center justify-center rounded-full bg-transparent transition-colors",
        liked ? "text-primary" : "text-zinc-500 hover:text-primary",
        className
      )}
    >
      <Heart
        key={liked ? "liked" : "unliked"}
        size={22}
        strokeWidth={1.75}
        fill={liked ? "currentColor" : "none"}
        className={liked ? "animate-in zoom-in-50 duration-300" : undefined}
      />
    </button>
  );
}
