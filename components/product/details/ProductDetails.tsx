"use client";

import { useMemo, useState } from "react";
import type { Product } from "@/types/product";
import { distinctValues, type ProductVariant } from "@/lib/variant-utils";
import { useEffectiveStocks } from "@/lib/use-effective-stock";
import ProductGallery from "./ProductGallery";
import ProductSummary from "./ProductSummary";
import type { VariantSelection } from "./VariantPicker";

interface ProductDetailsProps {
  product: Product;
  /** The product's colors/sizes — empty for a plain product. */
  variants: ProductVariant[];
}

/**
 * The photo gallery and the buy box side by side. They live in one component
 * because they share the shopper's color/size choice: picking a color jumps
 * the gallery to that color's photo, while the thumbnails underneath stay
 * what they've always been — just a way to look around, never a choice of
 * what gets ordered.
 */
export default function ProductDetails({ product, variants }: ProductDetailsProps) {
  const hasOptions = !!product.hasVariants && variants.length > 0;
  const colors = useMemo(() => distinctValues(variants.map((v) => v.color)), [variants]);
  const sizes = useMemo(() => distinctValues(variants.map((v) => v.size)), [variants]);

  const [picked, setPicked] = useState<VariantSelection>({ color: "", size: "" });
  // With only one color (or one size) there's nothing to choose, so it's
  // taken as chosen — everything else stays unselected until the shopper picks.
  const selection: VariantSelection = {
    color: picked.color || (colors.length === 1 ? colors[0] : ""),
    size: picked.size || (sizes.length === 1 ? sizes[0] : ""),
  };

  const stockEntries = useMemo(() => variants.map((v) => ({ id: v.id, stock: v.stock })), [variants]);
  const stocks = useEffectiveStocks(stockEntries);

  const selectedVariant = useMemo(() => {
    if (!hasOptions) return null;
    if (colors.length > 0 && !selection.color) return null;
    if (sizes.length > 0 && !selection.size) return null;
    return (
      variants.find(
        (v) => (colors.length === 0 || v.color === selection.color) && (sizes.length === 0 || v.size === selection.size)
      ) ?? null
    );
  }, [hasOptions, colors, sizes, selection.color, selection.size, variants]);

  // The photo to show: the exact option's, else the chosen color's.
  const focusImage = hasOptions
    ? (selectedVariant?.imageUrl ??
      variants.find((v) => selection.color && v.color === selection.color && v.imageUrl)?.imageUrl ??
      null)
    : null;

  return (
    <div className="grid gap-16 lg:grid-cols-2">
      <ProductGallery product={product} focusImage={focusImage} />
      <ProductSummary
        product={product}
        variants={variants}
        colors={colors}
        sizes={sizes}
        selection={selection}
        onSelectionChange={setPicked}
        selectedVariant={selectedVariant}
        stocks={stocks}
      />
    </div>
  );
}
