"use client";

import { useEffect, useRef, useState } from "react";
import { Product } from "@/types/product";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import ProductImage from "./ProductImage";
import ProductInfo from "./ProductInfo";
import ProductActions from "./ProductActions";
import ProductHoverDetail from "./ProductHoverDetail";
import WishlistButton from "./WishlistButton";
import type { Currency } from "@/lib/currency";

interface ProductCardProps {
  product: Product;
  currency?: Currency;
  /**
   * "grid" (default): image on top, text below, on every screen size. Used
   * for the homepage's 2-column discovery grid.
   * "list": on phones the card turns into one horizontal row (square image
   * on the left, name, price and a small button on the right), like
   * Amazon's search results. From md up it is the same as "grid".
   */
  layout?: "grid" | "list";
}

// The expanded hover preview only makes sense with a real mouse on a wide
// screen. Phones and tablets have no hover, and a "preview" that opens on
// the first tap makes people tap twice to buy something.
const HOVER_QUERY = "(min-width: 768px) and (hover: hover)";

function canHover() {
  return typeof window !== "undefined" && window.matchMedia(HOVER_QUERY).matches;
}

export default function ProductCard({ product, currency = "ETB", layout = "grid" }: ProductCardProps) {
  const [open, setOpen] = useState(false);
  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isList = layout === "list";

  useEffect(() => {
    return () => {
      if (showTimer.current) {
        clearTimeout(showTimer.current);
        showTimer.current = null;
      }
    };
  }, []);

  function scheduleOpen() {
    if (!canHover()) return;
    if (showTimer.current) clearTimeout(showTimer.current);
    showTimer.current = setTimeout(() => setOpen(true), 200);
  }

  function cancelOpen() {
    if (showTimer.current) clearTimeout(showTimer.current);
    setOpen(false);
  }

  return (
    <div
      className="relative h-full"
      onMouseEnter={scheduleOpen}
      onMouseLeave={cancelOpen}
      onFocus={() => {
        if (canHover()) setOpen(true);
      }}
      onBlur={(e) => {
        // Only close once focus has left the card entirely, not when it
        // moves from the title link to the Add to Cart button inside it.
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <Card
        className={cn(
          "flex h-full flex-col gap-0 overflow-hidden py-0 transition-[transform,box-shadow] duration-200",
          // Desktop hover: float up and deepen the shadow instead of
          // growing, so nothing blurs or overlaps the neighbouring cards.
          "md:hover:-translate-y-1 md:hover:shadow-xl",
          isList && "max-md:flex-row"
        )}
      >
        <div className={cn("relative", isList && "max-md:w-[40%] max-md:shrink-0")}>
          {/* Clicking the picture or the text takes you to the product page */}
          <Link href={`/products/${product.id}`} tabIndex={-1} aria-hidden="true" className="block">
            <ProductImage product={product} />
          </Link>
          <WishlistButton product={product} className="absolute right-1 top-1 z-10 sm:right-2 sm:top-2" />
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <Link href={`/products/${product.id}`} className="flex flex-1 flex-col">
            <ProductInfo product={product} currency={currency} />
          </Link>
          <ProductActions product={product} />
        </div>
      </Card>

      {open && <ProductHoverDetail product={product} currency={currency} />}
    </div>
  );
}
