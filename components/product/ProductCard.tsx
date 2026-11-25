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
import type { Currency } from "@/lib/currency";

interface ProductCardProps {
  product: Product;
  currency?: Currency;
  /**
   * "grid" (default): picture on top, then title, price and button. Used in
   * the 2-column (phone) and 4-column (desktop) grids.
   * "row": picture on the left, details on the right, like Amazon's search
   * results. On a phone this is the one-column shop list; from the md
   * breakpoint up it turns back into the normal grid card.
   */
  layout?: "grid" | "row";
}

// The hover preview only makes sense with a mouse on a wide screen. Phones
// and tablets have no cursor, so there a card stays static and a tap goes
// straight to the product page.
const HOVER_QUERY = "(hover: hover) and (min-width: 768px)";

function canHover() {
  return typeof window !== "undefined" && window.matchMedia(HOVER_QUERY).matches;
}

export default function ProductCard({
  product,
  currency = "ETB",
  layout = "grid",
}: ProductCardProps) {
  const [open, setOpen] = useState(false);
  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const row = layout === "row";

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
      // A small lift (not a scale) on desktop: text and photos stay sharp
      // and the neighbouring cards are never overlapped by a growing box.
      // z-20 while the preview is open keeps it above the next cards in the
      // grid, because the lift gives this wrapper its own stacking context.
      className={cn(
        "relative h-full motion-safe:transition-transform motion-safe:duration-200 md:hover:-translate-y-1",
        open && "z-20"
      )}
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
          "h-full gap-0 overflow-hidden py-0 transition-shadow duration-200 md:hover:shadow-xl",
          row
            ? "grid grid-cols-[8.75rem_minmax(0,1fr)] content-start items-start md:flex md:flex-col"
            : "flex flex-col"
        )}
      >
        {/* Clicking the image or text takes you to the product details page */}
        <Link href={`/products/${product.id}`} className="contents">
          <ProductImage product={product} row={row} />
          <ProductInfo product={product} currency={currency} row={row} />
        </Link>

        {/* The interactive button section */}
        <ProductActions product={product} row={row} />
      </Card>

      {open && <ProductHoverDetail product={product} currency={currency} />}
    </div>
  );
}
