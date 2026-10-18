import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Mirrors ProductCard's layout (ProductImage + ProductInfo + ProductActions)
// so the page doesn't visibly shift once real data replaces it.
export default function ProductCardSkeleton() {
  return (
    <Card className="flex flex-col gap-0 overflow-hidden py-0">
      <Skeleton className="aspect-square w-full rounded-none" />

      <CardHeader className="p-4 pb-1.5">
        <div className="flex items-start justify-between gap-4">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-5 w-12 shrink-0" />
        </div>
      </CardHeader>

      <CardContent className="grow space-y-2 p-4 pb-3 pt-0">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </CardContent>

      <CardFooter className="mt-auto flex gap-2 bg-transparent p-4 py-3">
        <Skeleton className="h-11 flex-1 rounded-xl" />
        <Skeleton className="h-11 w-11 rounded-xl" />
      </CardFooter>
    </Card>
  );
}
