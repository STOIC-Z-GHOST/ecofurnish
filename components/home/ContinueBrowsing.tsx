"use client";

import Image from "next/image";
import Link from "next/link";
import { History, ArrowRight } from "lucide-react";
import { useRecentlyViewed } from "@/lib/recently-viewed-context";
import { useCurrency } from "@/lib/currency-context";
import { formatPrice } from "@/lib/currency";

/** Highlights the single most-recent product this browser looked at,
 * inviting them back to it. Sibling to RecentFinds, which covers
 * everything else in the history — this is deliberately just the one. */
export default function ContinueBrowsing() {
  const { items } = useRecentlyViewed();
  const { currency } = useCurrency();

  if (items.length === 0) return null;
  const [latest] = items;

  return (
    <section className="py-10">
      <div className="container mx-auto px-4">
        <Link
          href={`/products/${latest.productId}`}
          className="group flex flex-col items-center gap-5 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40 sm:flex-row sm:gap-6 sm:p-6"
        >
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-muted sm:h-28 sm:w-28">
            <Image
              src={latest.imageUrl || "/placeholder.jpg"}
              alt={latest.name}
              fill
              className="object-cover"
              sizes="112px"
            />
          </div>

          <div className="min-w-0 flex-1 text-center sm:text-left">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <History className="h-3.5 w-3.5" />
              Pick up from where you left off
            </span>
            <p className="mt-1 truncate text-lg font-semibold text-foreground">{latest.name}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {formatPrice(latest.price, currency)}
            </p>
          </div>

          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-transform group-hover:translate-x-0.5">
            Continue browsing
            <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
      </div>
    </section>
  );
}
