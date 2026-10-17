import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Star rating as a green pill that sits on the product picture — same
 * look as the "kg Diverted" pill in the opposite corner (see
 * ProductImage). Renders nothing when the product has no reviews yet.
 */
export default function RatingBadge({
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
    <Badge
      className={cn(
        "flex items-center gap-1 bg-emerald-700 px-1.5 py-0.5 text-[0.65rem] text-white shadow-sm hover:bg-emerald-800 sm:px-2 sm:py-0.5 sm:text-xs",
        className
      )}
      aria-label={`Rated ${rating.toFixed(1)} out of 5 from ${count} reviews`}
    >
      <Star className="h-2.5 w-2.5 fill-yellow-300 text-yellow-300 sm:h-3 sm:w-3" aria-hidden="true" />
      {rating.toFixed(1)}
      <span className="opacity-80">({count})</span>
    </Badge>
  );
}
