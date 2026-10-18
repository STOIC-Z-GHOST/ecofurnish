"use client";

import { CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { getEffectivePrice } from "@/lib/pricing";
import { useEffectiveStock } from "@/lib/use-effective-stock";
import { toast } from "sonner";
import { Product } from "@/types/product";
import WishlistButton from "./WishlistButton";

export default function ProductActions({ product }: { product: Product }) {
  const { addItem } = useCart();
  const effectiveStock = useEffectiveStock(product.id, product.stock);

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation(); // Stops the parent click event

    addItem({
      productId: product.id,
      name: product.name,
      price: getEffectivePrice(product),
      imageUrl: product.imageUrl,
      stock: effectiveStock,
    });
    toast.success(`${product.name} added to cart`);
  }

  return (
    <CardFooter className="mt-auto flex gap-1.5 bg-transparent p-3 sm:gap-2 sm:p-4 sm:py-3">
      <Button
        size="lg"
        className="flex flex-1 items-center gap-1 text-xs sm:gap-1.5 sm:text-sm"
        disabled={effectiveStock <= 0}
        onClick={handleAddToCart}
      >
        {effectiveStock > 0 ? (
          <>
            <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Add to Cart
          </>
        ) : (
          "Out of Stock"
        )}
      </Button>
      <WishlistButton product={product} />
    </CardFooter>
  );
}
