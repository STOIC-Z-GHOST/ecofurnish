"use client";

import { CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useCart, useCartRoom } from "@/lib/cart-context";
import { getEffectivePrice } from "@/lib/pricing";
import { useEffectiveStock } from "@/lib/use-effective-stock";
import { toast } from "sonner";
import { showCartToast } from "@/lib/cart-toast";
import { Product } from "@/types/product";

// "Add to Cart" and "Choose options" share one class string so they always
// have exactly the same height, padding and shape.
const BUTTON_CLASS =
  "h-9 w-full flex-1 items-center gap-1.5 rounded-md px-3 text-xs md:h-10 md:text-sm";

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
    if (added > 0) showCartToast(product.name, product.imageUrl);
    else toast.info(`All ${effectiveStock} in stock are already in your cart`);
  }

  const footerClass = "mt-auto border-t-0 bg-transparent p-3 pt-1 md:p-5 md:pt-2";

  // A product that comes in colors/sizes can't be added from the card: the
  // buyer has to choose on its page, so the card sends them there.
  if (product.hasVariants) {
    return (
      <CardFooter className={footerClass}>
        {product.stock <= 0 ? (
          <Button size="lg" className={BUTTON_CLASS} disabled>
            Out of Stock
          </Button>
        ) : (
          <Button
            size="lg"
            className={BUTTON_CLASS}
            render={<Link href={`/products/${product.id}`} />}
            nativeButton={false}
          >
            <ShoppingCart className="h-3.5 w-3.5 md:h-4 md:w-4" />
            Choose options
          </Button>
        )}
      </CardFooter>
    );
  }

  return (
    <CardFooter className={footerClass}>
      <Button
        size="lg"
        className={BUTTON_CLASS}
        disabled={effectiveStock <= 0 || allInCart || !ready}
        onClick={handleAddToCart}
      >
        {effectiveStock <= 0 ? (
          "Out of Stock"
        ) : allInCart ? (
          <>
            <Check className="h-3.5 w-3.5 md:h-4 md:w-4" />
            All in cart
          </>
        ) : (
          <>
            <ShoppingCart className="h-3.5 w-3.5 md:h-4 md:w-4" />
            Add to Cart
          </>
        )}
      </Button>
    </CardFooter>
  );
}
