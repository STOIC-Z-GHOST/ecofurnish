import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Small "4.5 ★ (12)" line shown under a product's name, the way Amazon does
 * it. Renders nothing for a product with no reviews yet, so cards without
 * reviews don't carry an empty row (nothing here sits on the picture any
 * more).
 */
export default function CardRating({
  rating,
  count,
  className,
}: {
  rating?: number | null;
  count?: number;
  className?: string;
}) {
  if (rating == null || !count) return null;

  return (
    <div
      className={cn("flex items-center gap-1 text-xs", className)}
      aria-label={`Rated ${rating.toFixed(1)} out of 5 from ${count} reviews`}
    >
      <span className="font-medium text-foreground">{rating.toFixed(1)}</span>
      <Star className="size-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
      <span className="text-muted-foreground">({count})</span>
    </div>
  );
}
