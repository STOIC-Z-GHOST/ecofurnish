"use client";

import { noDash } from "@/lib/copy";
import { Truck } from "lucide-react";
import { DELIVERY_TOTAL } from "@/config/delivery";
import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { showCartToast } from "@/components/ui/cart-toast";
import { Product } from "@/types/product";
import { Badge } from "@/components/ui/badge";
import { cartLineKey, useCart, useCartRoom } from "@/lib/cart-context";
import { useCurrency } from "@/lib/currency-context";
import { formatPrice } from "@/lib/currency";
import { getEffectivePrice } from "@/lib/pricing";
import { useEffectiveStock } from "@/lib/use-effective-stock";
import { variantBasePrice, variantLabel, type ProductVariant } from "@/lib/variant-utils";
import ProductMeta from "./ProductMeta";
import QuantitySelector from "./QuantitySelector";
import AddToCartButton from "../AddToCartButton";
import WishlistButton from "../WishlistButton";
import StockBadge from "../StockBadge";
import VariantPicker, { type VariantSelection } from "./VariantPicker";

interface ProductSummaryProps {
  product: Product;
  /** Colors/sizes this product comes in — empty for a plain product. */
  variants?: ProductVariant[];
  colors?: string[];
  sizes?: string[];
  selection?: VariantSelection;
  onSelectionChange?: (next: VariantSelection) => void;
  /** The option the shopper has fully chosen, once they have. */
  selectedVariant?: ProductVariant | null;
  /** Stock per option id, as this browser should see it. */
  stocks?: Record<string, number>;
}

export default function ProductSummary({
  product,
  variants = [],
  colors = [],
  sizes = [],
  selection = { color: "", size: "" },
  onSelectionChange,
  selectedVariant = null,
  stocks = {},
}: ProductSummaryProps) {
  const { addItem } = useCart();
  const { currency } = useCurrency();
  const [quantity, setQuantity] = useState(1);
  const hasOptions = !!product.hasVariants && variants.length > 0;
  const plainStock = useEffectiveStock(product.id, product.stock);
  // For a product with colors/sizes the stock that matters is the chosen
  // option's own — nothing is "in stock" until the shopper has chosen one.
  const variantStock = selectedVariant ? (stocks[selectedVariant.id] ?? selectedVariant.stock) : 0;
  const effectiveStock = hasOptions ? variantStock : plainStock;
  const allSoldOut = hasOptions && variants.every((v) => (stocks[v.id] ?? v.stock) <= 0);
  const needsChoice = hasOptions && !selectedVariant;
  const outOfStock = hasOptions ? allSoldOut || (!needsChoice && effectiveStock <= 0) : effectiveStock <= 0;
  const lineKey = cartLineKey({ productId: product.id, variantId: selectedVariant?.id });
  const { inCart, remaining, allInCart, ready } = useCartRoom(lineKey, effectiveStock);
  // The quantity picker can never ask for more than is still free.
  const pickerQuantity = Math.min(quantity, Math.max(1, remaining));

  // What the shopper is looking at costs the product's price plus the chosen
  // option's small difference — discounts apply on top of that.
  const shownBasePrice = selectedVariant ? variantBasePrice(product.price, selectedVariant.priceDelta) : product.price;
  const pricedProduct = { ...product, price: shownBasePrice };
  const chosenLabel = selectedVariant ? variantLabel(selectedVariant) : null;

  // What's still to choose, for the button.
  const missing = [colors.length > 0 && !selection.color ? "color" : null, sizes.length > 0 && !selection.size ? "size" : null]
    .filter(Boolean)
    .join(" and ");
  const prompt = needsChoice && !allSoldOut ? `Choose a ${missing || "option"}` : undefined;

  function handleAddToCart() {
    if (!ready) return;
    if (hasOptions && !selectedVariant) return;
    const label = chosenLabel ? ` (${chosenLabel})` : "";
    const added = addItem(
      {
        productId: product.id,
        variantId: selectedVariant?.id ?? null,
        variantLabel: chosenLabel,
        name: product.name,
        price: getEffectivePrice(pricedProduct),
        imageUrl: selectedVariant?.imageUrl ?? product.imageUrl,
        stock: effectiveStock,
      },
      pickerQuantity
    );
    if (added <= 0) {
      toast.info(`All ${effectiveStock} in stock are already in your cart`);
    } else if (added < pickerQuantity) {
      toast.success(`Added ${added}, that's all that was left (${effectiveStock} in your cart)`);
    } else {
      showCartToast({
        name: `${product.name}${label}`,
        imageUrl: selectedVariant?.imageUrl ?? product.imageUrl,
        detail: `${added} added to cart`,
      });
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
        <h1 className="mt-1 text-3xl font-bold sm:text-4xl">{product.name}</h1>
      </div>

      <ProductMeta
        price={shownBasePrice}
        currency={currency}
        avgRating={product.avgRating}
        reviewCount={product.reviewCount}
        discountPercent={product.discountPercent}
        discountReason={product.discountReason}
        dealEndsAt={product.dealEndsAt}
      />

      {selectedVariant ? (
        <StockBadge productId={selectedVariant.id} stock={selectedVariant.stock} restockAt={product.restockAt} />
      ) : (
        <StockBadge productId={product.id} stock={product.stock} restockAt={product.restockAt} />
      )}

      <p className="text-muted-foreground">
        {noDash(product.description) || "Sustainable furniture crafted from recycled materials."}
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

      {hasOptions && !allSoldOut && onSelectionChange && (
        <VariantPicker
          variants={variants}
          colors={colors}
          sizes={sizes}
          selection={selection}
          onChange={onSelectionChange}
          stocks={stocks}
        />
      )}

      {!outOfStock && !allInCart && !needsChoice && (
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
            {formatPrice((parseFloat(getEffectivePrice(pricedProduct)) * pickerQuantity).toFixed(2), currency)}
          </span>
        </div>
      )}

      <div className="flex gap-3">
        <AddToCartButton
          onClick={handleAddToCart}
          disabled={outOfStock}
          maxed={allInCart}
          loading={!ready}
          prompt={prompt}
        />
        <WishlistButton product={product} />
      </div>

      <p className="flex items-start gap-2 text-sm text-muted-foreground">
        <Truck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <span>
          Delivery in {DELIVERY_TOTAL.addis} business days in Addis Ababa, {DELIVERY_TOTAL.elsewhere}{" "}
          elsewhere in Ethiopia.
        </span>
      </p>

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
