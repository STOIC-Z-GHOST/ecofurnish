import { Skeleton } from "@/components/ui/skeleton";
import ProductCardSkeleton from "@/components/product/ProductCardSkeleton";

// Shown while app/page.tsx's catalog query is resolving. Shaped like the
// real page (hero, featured row, full grid) instead of a full-screen
// spinner, so the layout doesn't jump once data arrives.
export default function Loading() {
  return (
    <main>
      <section className="container mx-auto max-w-7xl px-4 py-20">
        <Skeleton className="h-10 w-2/3 max-w-md" />
        <Skeleton className="mt-4 h-5 w-full max-w-lg" />
        <Skeleton className="mt-2 h-5 w-3/4 max-w-md" />
        <Skeleton className="mt-8 h-11 w-40 rounded-xl" />
      </section>

      <section className="container mx-auto max-w-7xl px-4 py-12">
        <Skeleton className="mb-8 h-8 w-56" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </section>

      <section className="container mx-auto max-w-7xl px-4 py-12">
        <Skeleton className="mb-2 h-8 w-48" />
        <Skeleton className="mb-8 h-5 w-64" />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </section>
    </main>
  );
}
