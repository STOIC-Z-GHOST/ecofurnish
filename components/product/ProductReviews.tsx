"use client";

import { useState } from "react";
import { Star, BadgeCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { submitReview } from "@/lib/reviews";
import type { ReviewWithMeta } from "@/lib/reviews";

// "Sarah M." instead of a full name in the list — a common review-list
// convention, and this stays display-only (the full name is still what's
// stored and what's used for the "is this your review" edit check).
function displayName(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          className="p-0.5"
        >
          <Star
            size={24}
            className={n <= value ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}
          />
        </button>
      ))}
    </div>
  );
}

interface ProductReviewsProps {
  productId: string;
  reviews: ReviewWithMeta[];
  // Server-computed: is the signed-in visitor allowed to review this
  // product at all (delivered order containing it), and do they already
  // have one (pre-fills the form as an edit instead of a fresh review).
  canReview: boolean;
  myExistingReview: { rating: number; comment: string | null } | null;
}

export default function ProductReviews({
  productId,
  reviews,
  canReview,
  myExistingReview,
}: ProductReviewsProps) {
  const [rating, setRating] = useState(myExistingReview?.rating ?? 0);
  const [comment, setComment] = useState(myExistingReview?.comment ?? "");
  const [submitting, setSubmitting] = useState(false);
  // Tracks "just submitted in this session" so the form can collapse into
  // a confirmation — but stays reopenable via the Edit link below, rather
  // than disappearing until the next full page load.
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [formOpen, setFormOpen] = useState(true);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating < 1) {
      toast.error("Pick a star rating first.");
      return;
    }
    setSubmitting(true);
    try {
      await submitReview(productId, rating, comment);
      toast.success(myExistingReview ? "Review updated" : "Review posted, thanks!");
      setJustSubmitted(true);
      setFormOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't post your review.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mt-24 max-w-2xl">
      <h2 className="text-2xl font-bold tracking-tight">Reviews</h2>

      {canReview && formOpen && (
        <form onSubmit={handleSubmit} className="mt-6 space-y-3 rounded-lg border border-border/60 p-4">
          <p className="text-sm font-medium">
            {myExistingReview || justSubmitted ? "Edit your review" : "You bought this, leave a review"}
          </p>
          <StarPicker value={rating} onChange={setRating} />
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Optional, what did you think?"
            rows={3}
          />
          <Button type="submit" disabled={submitting}>
            {myExistingReview || justSubmitted ? "Update review" : "Post review"}
          </Button>
        </form>
      )}

      {canReview && !formOpen && (
        <button
          type="button"
          onClick={() => setFormOpen(true)}
          className="mt-6 text-sm font-medium text-primary hover:underline"
        >
          Edit your review
        </button>
      )}

      {reviews.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">No reviews yet.</p>
      ) : (
        <div className="mt-6 space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className="border-t border-border/60 pt-4 first:border-t-0 first:pt-0">
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      size={14}
                      className={
                        n <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                      }
                    />
                  ))}
                </div>
                <span className="text-sm font-medium">{displayName(review.userName)}</span>
                {/* Every review here came from a gated, delivered-order
                    check (see canReviewProduct in lib/reviews.ts) — so
                    this badge is unconditional, not a per-review flag. */}
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <BadgeCheck size={14} className="text-primary" />
                  Verified Purchase
                </span>
              </div>
              {review.comment && <p className="mt-1.5 text-sm text-muted-foreground">{review.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
