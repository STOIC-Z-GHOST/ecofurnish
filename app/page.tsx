import { db } from "@/db";
import { products } from "@/db/schema";
import { Suspense } from "react";
import dynamic from "next/dynamic";
import { Leaf, Recycle, Truck } from "lucide-react";
import { attachRatings } from "@/lib/reviews";
import Hero from "@/components/home/Hero";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import Categories from "@/components/home/Categories";
import Testimonials from "@/components/home/Testimonials";
import ContinueBrowsing from "@/components/home/ContinueBrowsing";
import RecentFinds from "@/components/home/RecentFinds";
import { CatalogView } from "@/components/catalog-view";

// Both are the very last things on the page, and neither affects LCP or
// anything above the fold — Newsletter is a self-contained client
// component (its own useState/useEffect/session check), and AdBanner
// already defers its heavy part (the video) internally, but its component
// code and IntersectionObserver setup don't need to be in the initial
// bundle either. Splitting them out is free: nothing here is needed until
// a visitor has scrolled most of the way down.
const Newsletter = dynamic(() => import("@/components/home/Newsletter"));
const AdBanner = dynamic(() => import("@/components/home/AdBanner"));

// This page makes no calls to headers()/cookies(), so Next statically
// generates it once at build time and serves that same HTML from Vercel's
// cache indefinitely (independent of the database, and shared across every
// visitor — not per-browser). revalidate here re-generates it on the first
// request after each window elapses, and submitReview() also calls
// revalidatePath("/") so a real in-app review submission busts this
// instantly rather than waiting out the window.
export const revalidate = 300;

export default async function Home() {
  const rawCatalog = await db.select().from(products);
  const catalog = await attachRatings(rawCatalog);
  const featured = catalog.slice(0, 3);

  return (
    <main>
      <Hero />

      <ContinueBrowsing />

      <FeaturedProducts products={featured} />

      <RecentFinds />

      <Categories />

      <div id="all-products" className="container mx-auto max-w-7xl px-4 py-12">
        <div className="mb-10">
          <h2 className="text-3xl font-bold tracking-tight">Full Catalog</h2>
          <p className="mt-2 text-lg text-muted-foreground">
            Sustainable furniture that cleans our streets.
          </p>
        </div>

        {catalog.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed bg-muted/20 py-24 text-center">
            <h2 className="mb-2 text-2xl font-semibold">Your catalog is empty</h2>
            <p className="text-muted-foreground">
              Run <code className="rounded bg-muted px-1.5 py-0.5">pnpm db:seed</code> to add
              the starter products, or add your own to the database to see them appear here.
            </p>
          </div>
        ) : (
          <Suspense fallback={null}>
            <CatalogView products={catalog} />
          </Suspense>
        )}
      </div>

      <AdBanner videoSrc="/ads/ad-1.mp4" posterSrc="/ads/ad-1-poster.jpg" />

      <section id="about" className="border-t border-border/60 bg-muted/30">
        <div className="container mx-auto max-w-7xl px-4 py-16">
          <h2 className="text-2xl font-bold tracking-tight">Our Impact</h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Every piece in the EcoFurnish catalog is built from recycled
            plastic composite, reclaimed wood, or both — here&apos;s how that
            plays out from raw material to your living room.
          </p>

          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            <div>
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Recycle className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-semibold">Recycled materials</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Collected plastic waste is cleaned, shredded, and remoulded
                into structural panels and shells for our furniture.
              </p>
            </div>
            <div>
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Leaf className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-semibold">Every product labeled</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Each listing shows the plastic diverted for that specific
                piece, so you know exactly what you&apos;re supporting.
              </p>
            </div>
            <div>
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Truck className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-semibold">Local delivery</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Orders ship from Addis Ababa, keeping transport emissions
                low for customers across Ethiopia.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Testimonials />
      <Newsletter />
    </main>
  );
}
