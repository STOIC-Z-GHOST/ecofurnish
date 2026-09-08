"use client";

import Image from "next/image";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { useRecentlyViewed } from "@/lib/recently-viewed-context";
import { useCurrency } from "@/lib/currency-context";
import { formatPrice } from "@/lib/currency";

/** A browsable strip of everything else this browser has looked at
 * recently, snapshotted at view time (same "don't re-fetch, just show
 * what was saved" convention the wishlist page uses) — not the most
 * recent one, which ContinueBrowsing already covers on its own. */
export default function RecentFinds() {
  const { items } = useRecentlyViewed();
  const { currency } = useCurrency();

  const rest = items.slice(1);
  if (rest.length === 0) return null;

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="mb-10 text-center">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" />
            Your Recent Finds
          </span>
          <p className="mt-2 text-muted-foreground">Pieces you&apos;ve had your eye on.</p>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-2">
          {rest.map((item) => (
            <Link
              key={item.productId}
              href={`/products/${item.productId}`}
              className="group w-36 shrink-0 sm:w-44"
            >
              <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
                <Image
                  src={item.imageUrl || "/placeholder.jpg"}
                  alt={item.name}
                  fill
                  className="object-cover transition-transform duration-200 group-hover:scale-105"
                  sizes="176px"
                />
              </div>
              <p className="mt-2 line-clamp-1 text-sm font-medium text-foreground">{item.name}</p>
              <p className="text-sm text-muted-foreground">{formatPrice(item.price, currency)}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
