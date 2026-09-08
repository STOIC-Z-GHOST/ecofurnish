"use client";

import { useEffect, useRef } from "react";
import { useRecentlyViewed } from "@/lib/recently-viewed-context";
import type { Product } from "@/types/product";

/** Mount this on a product detail page to log this browser's view of it
 * into "recently viewed" — same fire-once-on-mount shape as
 * RecordSimulatedPurchase. Renders nothing. */
export function RecordProductView({ product }: { product: Product }) {
  const { recordView } = useRecentlyViewed();
  const recorded = useRef(false);

  useEffect(() => {
    if (recorded.current) return;
    recorded.current = true;
    recordView({
      productId: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      category: product.category,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
