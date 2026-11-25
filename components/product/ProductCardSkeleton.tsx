import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Mirrors ProductCard's layout (square image, name, price, button) so the
// page doesn't visibly shift once real data replaces it.
export default function ProductCardSkeleton() {
  return (
    <Card className="flex flex-col gap-0 overflow-hidden py-0">
      <Skeleton className="aspect-square w-full rounded-none" />

      <div className="space-y-2 p-3 md:p-5">
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="hidden h-4 w-full md:block" />
        <Skeleton className="hidden h-4 w-3/4 md:block" />
        <Skeleton className="mt-3 h-9 w-full rounded-md md:h-10" />
      </div>
    </Card>
  );
}
