// Pure helpers for product options (colors / sizes). No database code in
// here, so client components (the product page, the cart) can import it.

/** One orderable combination of a product's options, as the storefront sees it. */
export interface ProductVariant {
  id: string;
  productId: string;
  /** "" when the product has no colors. */
  color: string;
  /** "" when the product has no sizes. */
  size: string;
  /** Added to the product's base price. A decimal string; may be negative. */
  priceDelta: string;
  stock: number;
  /** The photo shown when this option is chosen (usually the color's picture). */
  imageUrl: string | null;
}

/** "Red / Large", "Red", or "Large" — however much of it there is. */
export function variantLabel(v: { color: string; size: string }): string {
  return [v.color.trim(), v.size.trim()].filter(Boolean).join(" / ");
}

/** The product's base price plus this option's difference, as a 2dp string. */
export function variantBasePrice(basePrice: string, priceDelta: string | null | undefined): string {
  const total = parseFloat(basePrice) + parseFloat(priceDelta ?? "0");
  return (Number.isFinite(total) ? Math.max(0, total) : parseFloat(basePrice)).toFixed(2);
}

/**
 * The identity of a cart line. A plain product is just its id; a product
 * with options is the product id plus the chosen option — so 2 red and
 * 4 blue of the same chair are two separate lines instead of one.
 */
export function cartLineKey(line: { productId: string; variantId?: string | null }): string {
  return line.variantId ? `${line.productId}:${line.variantId}` : line.productId;
}

/** Distinct, non-empty values in first-seen order. */
export function distinctValues(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of values) {
    const v = raw.trim();
    if (v && !seen.has(v.toLowerCase())) {
      seen.add(v.toLowerCase());
      out.push(v);
    }
  }
  return out;
}
