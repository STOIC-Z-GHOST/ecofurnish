import { asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { productVariants } from "@/db/schema";
import type { ProductVariant } from "@/lib/variant-utils";

type VariantRow = typeof productVariants.$inferSelect;

function toVariant(row: VariantRow): ProductVariant {
  return {
    id: row.id,
    productId: row.productId,
    color: row.color,
    size: row.size,
    priceDelta: row.priceDelta,
    stock: row.stock,
    imageUrl: row.imageUrl,
  };
}

/** A product's options, in the order the admin arranged them. */
export async function getVariantsForProduct(productId: string): Promise<ProductVariant[]> {
  const rows = await db
    .select()
    .from(productVariants)
    .where(eq(productVariants.productId, productId))
    .orderBy(asc(productVariants.sortOrder), asc(productVariants.createdAt));
  return rows.map(toVariant);
}

/** Options for several products at once, grouped by product id. */
export async function getVariantsForProducts(productIds: string[]): Promise<Map<string, ProductVariant[]>> {
  const map = new Map<string, ProductVariant[]>();
  if (productIds.length === 0) return map;
  const rows = await db
    .select()
    .from(productVariants)
    .where(inArray(productVariants.productId, productIds))
    .orderBy(asc(productVariants.sortOrder), asc(productVariants.createdAt));
  for (const row of rows) {
    const list = map.get(row.productId) ?? [];
    list.push(toVariant(row));
    map.set(row.productId, list);
  }
  return map;
}

/**
 * Re-adds a product's total stock from its options. The catalog, the stock
 * badges and the Telegram digest all read products.stock, so for a product
 * with options that number must always equal the sum of its variants.
 */
export async function recomputeProductStock(productId: string) {
  await db.execute(sql`
    update products
       set stock = coalesce((select sum(stock) from product_variants where product_id = ${productId}), 0)
     where id = ${productId}
  `);
}
