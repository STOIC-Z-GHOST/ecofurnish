"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { reviews } from "@/db/schema";
import { auth } from "@/lib/auth";
import { canReviewProduct, getMyReviewForProduct } from "@/lib/reviews-queries";

export type { ReviewWithMeta } from "@/lib/reviews-queries";

const MAX_COMMENT_LENGTH = 2000;

export async function submitReview(productId: string, rating: number, comment: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("You need to be signed in to leave a review.");

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error("Rating must be between 1 and 5.");
  }

  if (typeof comment !== "string" || comment.length > MAX_COMMENT_LENGTH) {
    throw new Error(`Reviews can be up to ${MAX_COMMENT_LENGTH} characters.`);
  }

  const allowed = await canReviewProduct(session.user.id, productId);
  if (!allowed) {
    throw new Error("You can only review products from a delivered order.");
  }

  const existing = await getMyReviewForProduct(session.user.id, productId);
  const trimmedComment = comment.trim() || null;

  if (existing) {
    await db
      .update(reviews)
      .set({ rating, comment: trimmedComment, updatedAt: new Date() })
      .where(eq(reviews.id, existing.id));
  } else {
    await db.insert(reviews).values({
      productId,
      userId: session.user.id,
      userName: session.user.name || "Anonymous",
      rating,
      comment: trimmedComment,
    });
  }

  revalidatePath(`/products/${productId}`);
  revalidatePath("/");
}
