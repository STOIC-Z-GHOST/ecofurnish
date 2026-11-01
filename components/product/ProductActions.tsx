"use client";

import { CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, ShoppingCart } from "lucide-react";
import { useCart, useCartRoom } from "@/lib/cart-context";
import { getEffectivePrice } from "@/lib/pricing";
import { useEffectiveStock } from "@/lib/use-effective-stock";
import { toast } from "sonner";
import { Product } from "@/types/product";
import WishlistButton from "./WishlistButton";

export default function ProductActions({ product }: { product: Product }) {
  const { addItem } = useCart();
  const effectiveStock = useEffectiveStock(product.id, product.stock);
  const { allInCart, ready } = useCartRoom(product.id, effectiveStock);

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation(); // Stops the parent click event
    if (!ready) return;

    const added = addItem({
      productId: product.id,
      name: product.name,
      price: getEffectivePrice(product),
      imageUrl: product.imageUrl,
      stock: effectiveStock,
    });
    if (added > 0) toast.success(`${product.name} added to cart`);
    else toast.info(`All ${effectiveStock} in stock are already in your cart`);
  }

  return (
    <CardFooter className="mt-auto flex gap-1.5 bg-transparent p-3 sm:gap-2 sm:p-4 sm:py-3">
      <Button
        size="lg"
        className="flex flex-1 items-center gap-1 text-xs sm:gap-1.5 sm:text-sm"
        disabled={effectiveStock <= 0 || allInCart || !ready}
        onClick={handleAddToCart}
      >
        {effectiveStock <= 0 ? (
          "Out of Stock"
        ) : allInCart ? (
          <>
            <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            All in cart
          </>
        ) : (
          <>
            <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Add to Cart
          </>
        )}
      </Button>
      <WishlistButton product={product} />
    </CardFooter>
  );
}
