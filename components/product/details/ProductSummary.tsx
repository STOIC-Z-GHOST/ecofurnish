"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Product } from "@/types/product";
import { Badge } from "@/components/ui/badge";
import { useCart, useCartRoom } from "@/lib/cart-context";
import { useCurrency } from "@/lib/currency-context";
import { formatPrice } from "@/lib/currency";
import { getEffectivePrice } from "@/lib/pricing";
import { useEffectiveStock } from "@/lib/use-effective-stock";
import ProductMeta from "./ProductMeta";
import QuantitySelector from "./QuantitySelector";
import AddToCartButton from "../AddToCartButton";
import WishlistButton from "../WishlistButton";
import StockBadge from "../StockBadge";

interface ProductSummaryProps {
  product: Product;
}

export default function ProductSummary({ product }: ProductSummaryProps) {
  const { addItem } = useCart();
  const { currency } = useCurrency();
  const [quantity, setQuantity] = useState(1);
  const effectiveStock = useEffectiveStock(product.id, product.stock);
  const outOfStock = effectiveStock <= 0;
  const { inCart, remaining, allInCart } = useCartRoom(product.id, effectiveStock);
  // The quantity picker can never ask for more than is still free.
  const pickerQuantity = Math.min(quantity, Math.max(1, remaining));

  function handleAddToCart() {
    const added = addItem(
      {
        productId: product.id,
        name: product.name,
        price: getEffectivePrice(product),
        imageUrl: product.imageUrl,
        stock: effectiveStock,
      },
      pickerQuantity
    );
    if (added <= 0) {
      toast.info(`All ${effectiveStock} in stock are already in your cart`);
    } else if (added < pickerQuantity) {
      toast.success(`Added ${added} — that's all that was left (${effectiveStock} in your cart)`);
    } else {
      toast.success(`${added} × ${product.name} added to cart`);
    }
    setQuantity(1);
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/?category=${encodeURIComponent(product.category)}#all-products`}
          className="text-sm font-medium uppercase tracking-wide text-muted-foreground transition-colors hover:text-primary"
        >
          {product.category}
        </Link>
        <h1 className="mt-1 text-4xl font-bold">{product.name}</h1>
      </div>

      <ProductMeta
        price={product.price}
        currency={currency}
        avgRating={product.avgRating}
        reviewCount={product.reviewCount}
        discountPercent={product.discountPercent}
        discountReason={product.discountReason}
        dealEndsAt={product.dealEndsAt}
      />

      <StockBadge productId={product.id} stock={product.stock} restockAt={product.restockAt} />

      <p className="text-muted-foreground">
        {product.description || "Sustainable furniture crafted from recycled materials."}
      </p>

      {product.rooms.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Fits
          </span>
          {product.rooms.map((room) => (
            <Link key={room} href={`/?room=${encodeURIComponent(room)}#all-products`}>
              <Badge
                variant="outline"
                className="cursor-pointer transition-colors hover:border-primary hover:text-primary"
              >
                {room}
              </Badge>
            </Link>
          ))}
        </div>
      )}

      {!outOfStock && !allInCart && (
        <div className="flex items-center gap-2.5">
          <QuantitySelector
            quantity={pickerQuantity}
            onDecrease={() => setQuantity(Math.max(1, pickerQuantity - 1))}
            onIncrease={() => setQuantity(Math.min(remaining, pickerQuantity + 1))}
            max={remaining}
          />
          {/* Same pattern as the cart page's running-total badge: keyed on
              quantity so React remounts it on every +/- click, replaying
              the pop-in animation each time instead of only on first
              render. Uses getEffectivePrice (the discounted price, same
              value handleAddToCart actually sends to the cart) rather
              than product.price directly, so this preview always matches
              what actually gets added. */}
          <span
            key={pickerQuantity}
            className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold whitespace-nowrap text-primary duration-200 animate-in fade-in-0 zoom-in-90"
          >
            {formatPrice((parseFloat(getEffectivePrice(product)) * pickerQuantity).toFixed(2), currency)}
          </span>
        </div>
      )}

      <div className="flex gap-3">
        <AddToCartButton onClick={handleAddToCart} disabled={outOfStock} maxed={allInCart} />
        <WishlistButton product={product} />
      </div>

      {allInCart && (
        <p className="text-sm text-muted-foreground">
          You have all {inCart} available in your cart.{" "}
          <Link href="/cart" className="font-medium text-primary underline-offset-4 hover:underline">
            View cart
          </Link>
        </p>
      )}
    </div>
  );
}
