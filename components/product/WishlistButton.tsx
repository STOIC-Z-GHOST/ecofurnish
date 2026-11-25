"use client";

import { Heart } from "lucide-react";
import { useWishlist } from "@/lib/wishlist-context";
import { Product } from "@/types/product";
import { getEffectivePrice } from "@/lib/pricing";

export default function WishlistButton({ product }: { product: Product }) {
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
      className={`inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-transparent transition-colors hover:bg-muted ${
        liked
          ? "text-emerald-700 dark:text-emerald-400"
          : "text-muted-foreground hover:text-emerald-700 dark:hover:text-emerald-400"
      }`}
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
