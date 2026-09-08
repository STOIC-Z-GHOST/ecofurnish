"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Heart, Leaf, ShoppingCart, Star } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/lib/cart-context";
import { useWishlist } from "@/lib/wishlist-context";
import { formatPrice, type Currency } from "@/lib/currency";
import { getEffectivePrice, hasActiveDiscount } from "@/lib/pricing";
import { useEffectiveStock } from "@/lib/use-effective-stock";
import { Product } from "@/types/product";
import { NAV_HOVER_ICON } from "@/components/layout/navbar/nav-hover";
import CountdownTimer from "./CountdownTimer";
import StockBadge from "./StockBadge";

export default function ProductHoverDetail({
  product,
  currency,
}: {
  product: Product;
  currency: Currency;
}) {
  const discounted = hasActiveDiscount(product);
  const { addItem } = useCart();
  const { isWishlisted, toggleItem } = useWishlist();
  const liked = isWishlisted(product.id);
  const effectiveStock = useEffectiveStock(product.id, product.stock);

  // Cover photo first, then extras — lets shoppers flip through a
  // product's other pictures right from the catalog, without opening it.
  // Excludes the literal placeholder path too — a brand-new product
  // defaults its cover to /placeholder.jpg until an admin uploads a real
  // one, and without this, a product with extra photos added before its
  // cover was set would show that generic placeholder as if it were a
  // real photo in the gallery.
  const photos = [product.imageUrl, ...product.images].filter(
    (src): src is string => !!src && src !== "/placeholder.jpg"
  );
  const displayPhotos = photos.length > 0 ? photos : ["/placeholder.jpg"];
  const [photoIndex, setPhotoIndex] = useState(0);
  const hasMultiplePhotos = displayPhotos.length > 1;
  const displayImage = displayPhotos[photoIndex];

  function nextPhoto(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setPhotoIndex((i) => (i + 1) % displayPhotos.length);
  }

  function prevPhoto(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setPhotoIndex((i) => (i - 1 + displayPhotos.length) % displayPhotos.length);
  }

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      productId: product.id,
      name: product.name,
      price: getEffectivePrice(product),
      imageUrl: product.imageUrl,
      stock: effectiveStock,
    });
    toast.success(`${product.name} added to cart`);
  }

  function handleWishlist(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    toggleItem({
      productId: product.id,
      name: product.name,
      price: getEffectivePrice(product),
      imageUrl: product.imageUrl,
    });
  }

  return (
    // Grows over the card's own footprint (a few px bigger on every side)
    // instead of pushing new content in below it — the tile expands in
    // place, like a Store app card growing on hover.
    <div
      className="absolute -inset-2 z-30 flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl duration-150 animate-in fade-in-0 zoom-in-95 sm:-inset-3"
      // Purely supplementary — the card underneath already exposes the
      // same name/link/actions to the keyboard & screen-reader tab order,
      // so this expanded preview doesn't need its own stop in it.
      aria-hidden="true"
    >
      <Link href={`/products/${product.id}`} tabIndex={-1} className="contents">
        <div className="relative aspect-square shrink-0">
          {/* Same split as ProductGallery.tsx: image clipping lives on its
              own inner layer, separate from the outer positioning box, so
              the arrows' glow shadow can spill past their own edges
              instead of getting cut off by the same overflow-hidden that
              clips the photo. */}
          <div className="absolute inset-0 overflow-hidden bg-muted">
            <Image
              src={displayImage}
              alt={product.name}
              fill
              className="object-contain"
              sizes="(max-width: 767px) 55vw, (max-width: 1024px) 38vw, 28vw"
            />
            <Badge className="absolute left-2 top-2 flex items-center gap-1 bg-emerald-700 px-1.5 py-0.5 text-[0.65rem] text-white hover:bg-emerald-800 sm:left-3 sm:top-3 sm:px-2 sm:py-0.5 sm:text-xs">
              <Leaf className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              {product.plasticWeightKg}kg Diverted
            </Badge>
          </div>

          {hasMultiplePhotos && (
            <>
              <button
                type="button"
                tabIndex={-1}
                onClick={prevPhoto}
                aria-label="Previous photo"
                // !absolute — see ProductGallery.tsx for why plain
                // absolute isn't safe to combine with NAV_HOVER_ICON.
                className={`${NAV_HOVER_ICON} !absolute left-1.5 top-1/2 -translate-y-1/2 p-1.5 sm:left-2`}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                tabIndex={-1}
                onClick={nextPhoto}
                aria-label="Next photo"
                className={`${NAV_HOVER_ICON} !absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 sm:right-2`}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
                {displayPhotos.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1 w-1 rounded-full ${
                      i === photoIndex ? "bg-white" : "bg-white/50"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex grow flex-col p-3 pb-0 text-sm sm:p-4 sm:pb-0">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-heading text-base leading-snug font-medium">{product.name}</h3>
            {discounted ? (
              <div className="flex flex-col items-end whitespace-nowrap">
                <span className="text-lg font-bold text-primary">
                  {formatPrice(getEffectivePrice(product), currency)}
                </span>
                <span className="text-xs text-muted-foreground line-through">
                  {formatPrice(product.price, currency)}
                </span>
              </div>
            ) : (
              <span className="whitespace-nowrap text-lg font-bold text-primary">
                {formatPrice(product.price, currency)}
              </span>
            )}
          </div>

          {discounted && (
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span className="inline-block w-fit rounded-full bg-emerald-700 px-2 py-0.5 text-[0.65rem] font-semibold text-white">
                {product.discountPercent}% off
              </span>
              {product.dealEndsAt && <CountdownTimer endsAt={product.dealEndsAt} compact />}
            </div>
          )}

          {product.avgRating != null && product.reviewCount ? (
            <div className="mt-1 flex items-center gap-1">
              <Star className="size-3.5 fill-yellow-400 text-yellow-400" />
              <span className="text-xs font-medium">{product.avgRating.toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">({product.reviewCount})</span>
            </div>
          ) : null}

          <p className="mt-2 line-clamp-3 text-muted-foreground">
            {product.description || "Sustainable furniture crafted from recycled materials."}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <Badge variant="outline" className="capitalize">
              {product.category}
            </Badge>
            {product.rooms.map((room) => (
              <Badge key={room} variant="secondary" className="text-[0.65rem]">
                {room}
              </Badge>
            ))}
            <StockBadge productId={product.id} stock={product.stock} />
          </div>
        </div>
      </Link>

      <div className="mt-auto flex items-center gap-1.5 p-3 pt-3 sm:gap-2 sm:p-4">
        <button
          type="button"
          tabIndex={-1}
          disabled={effectiveStock <= 0}
          onClick={handleAddToCart}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50 sm:text-sm"
        >
          <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          {effectiveStock > 0 ? "Add to Cart" : "Out of Stock"}
        </button>
        <button
          type="button"
          tabIndex={-1}
          aria-pressed={liked}
          aria-label={liked ? "Remove from wishlist" : "Add to wishlist"}
          onClick={handleWishlist}
          className={`shrink-0 rounded-xl border p-2.5 transition-colors ${
            liked
              ? "border-red-500 bg-red-50 text-red-500"
              : "border-border text-muted-foreground hover:border-red-500 hover:text-red-500"
          }`}
        >
          <Heart size={16} fill={liked ? "currentColor" : "none"} />
        </button>
      </div>
    </div>
  );
}
