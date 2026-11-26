"use client";

import { CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useCart, useCartRoom } from "@/lib/cart-context";
import { getEffectivePrice } from "@/lib/pricing";
import { useEffectiveStock } from "@/lib/use-effective-stock";
import { toast } from "sonner";
import { showCartToast } from "@/components/ui/cart-toast";
import { Product } from "@/types/product";
import { cn } from "@/lib/utils";
import WishlistButton from "./WishlistButton";

// One height and one set of paddings for every button in every card, so
// "Add to Cart" and "Choose options" line up exactly across a row.
const FOOTER = "mt-auto flex items-center gap-1 border-0 bg-transparent p-3 pt-1 sm:gap-2 sm:p-5 sm:pt-2";
// min-w-0 + shrink let the button give up width to the heart instead of
// pushing it out of the card; the cart icon is dropped on phones to save room.
const BUTTON =
  "h-10 min-w-0 flex-1 shrink items-center justify-center gap-1.5 rounded-full px-3 text-[13px] sm:px-4 sm:text-sm";

export default function ProductActions({
  product,
  row = false,
}: {
  product: Product;
  /** Phone shop list: the button sits under the details, left aligned. */
  row?: boolean;
}) {
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
    if (added > 0) showCartToast({ name: product.name, imageUrl: product.imageUrl });
    else toast.info(`All ${effectiveStock} in stock are already in your cart`);
  }

  // A product that comes in colors/sizes can't be added from the card — the
  // buyer has to choose on its page, so the card sends them there.
  if (product.hasVariants) {
    return (
      <CardFooter className={cn(FOOTER, row && "pl-4 sm:pl-5 md:pl-5")}>
        {product.stock <= 0 ? (
          <Button size="lg" className={BUTTON} disabled>
            Out of Stock
          </Button>
        ) : (
          <Button
            size="lg"
            className={BUTTON}
            render={<Link href={`/products/${product.id}`} />}
            nativeButton={false}
          >
            <ShoppingCart className="hidden h-4 w-4 sm:block" />
            <span className="sm:hidden">Options</span>
            <span className="hidden sm:inline">Choose options</span>
          </Button>
        )}
        <WishlistButton product={product} />
      </CardFooter>
    );
  }

  return (
    <CardFooter className={cn(FOOTER, row && "pl-4 sm:pl-5 md:pl-5")}>
      <Button
        size="lg"
        className={BUTTON}
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
            <ShoppingCart className="hidden h-4 w-4 sm:block" />
            Add to Cart
          </>
        )}
      </Button>
      <WishlistButton product={product} />
    </CardFooter>
  );
}
