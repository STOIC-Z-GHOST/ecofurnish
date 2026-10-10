// Read-side review helpers, used by server components (the home page and
// the product page). Deliberately NOT in lib/reviews.ts: that file has
// "use server", which turns every export into a public endpoint anyone can
// call — and canReviewProduct / getMyReviewForProduct take a userId, so
// exposing them would let anyone probe another user's purchases and
// reviews. Only submitReview (which reads the signed-in user from the
// session, never from an argument) belongs in the actions file.
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { reviews, orders, orderItems } from "@/db/schema";

export interface ReviewWithMeta {
  id: string;
  userName: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
}

/** Attaches avgRating/reviewCount to a list of products in one query,
 * instead of one query per card. Returns null/0 for products with no
 * reviews yet rather than a fake 0-star rating. */
export async function attachRatings<T extends { id: string }>(
  productList: T[]
): Promise<(T & { avgRating: number | null; reviewCount: number })[]> {
  if (productList.length === 0) return [];

  const rows = await db
    .select({
      productId: reviews.productId,
      avgRating: sql<string>`avg(${reviews.rating})`,
      reviewCount: sql<string>`count(*)`,
    })
    .from(reviews)
    .where(
      inArray(
        reviews.productId,
        productList.map((p) => p.id)
      )
    )
    .groupBy(reviews.productId);

  const byProduct = new Map(
    rows.map((r) => [r.productId, { avgRating: parseFloat(r.avgRating), reviewCount: parseInt(r.reviewCount, 10) }])
  );

  return productList.map((p) => ({
    ...p,
    ...(byProduct.get(p.id) ?? { avgRating: null, reviewCount: 0 }),
  }));
}

export async function getReviewsForProduct(productId: string): Promise<ReviewWithMeta[]> {
  return db
    .select({
      id: reviews.id,
      userName: reviews.userName,
      rating: reviews.rating,
      comment: reviews.comment,
      createdAt: reviews.createdAt,
    })
    .from(reviews)
    .where(eq(reviews.productId, productId))
    .orderBy(sql`${reviews.createdAt} desc`);
}

/** True if this user has a delivered order containing this product —
 * the only thing that unlocks the review form. */
export async function canReviewProduct(userId: string, productId: string): Promise<boolean> {
  const [match] = await db
    .select({ id: orders.id })
    .from(orders)
    .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
    .where(
      and(eq(orders.userId, userId), eq(orders.status, "delivered"), eq(orderItems.productId, productId))
    )
    .limit(1);
  return Boolean(match);
}

export async function getMyReviewForProduct(userId: string, productId: string) {
  const [existing] = await db
    .select()
    .from(reviews)
    .where(and(eq(reviews.userId, userId), eq(reviews.productId, productId)))
    .limit(1);
  return existing ?? null;
}
