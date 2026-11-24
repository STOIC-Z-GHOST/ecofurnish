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
      className={`rounded-xl border p-3 transition-colors ${
        liked
          ? "border-red-500 bg-red-50 text-red-500"
          : "border-border text-muted-foreground hover:border-red-500 hover:text-red-500"
      }`}
    >
      <Heart
        key={liked ? "liked" : "unliked"}
        size={20}
        fill={liked ? "currentColor" : "none"}
        className={liked ? "animate-in zoom-in-50 duration-300" : undefined}
      />
    </button>
  );
}
