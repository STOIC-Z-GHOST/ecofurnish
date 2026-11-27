import { getSiteSettings } from "@/lib/site-settings";
import { db } from "@/db";
import { products } from "@/db/schema";
import { Suspense } from "react";
import dynamic from "next/dynamic";
import { attachRatings } from "@/lib/reviews-queries";
import { runAutoRestock } from "@/lib/auto-restock";
import Hero from "@/components/home/Hero";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import Categories from "@/components/home/Categories";
import Testimonials from "@/components/home/Testimonials";
import ImpactCards from "@/components/home/ImpactCards";
import SectionHeading from "@/components/home/SectionHeading";
import ContinueBrowsing from "@/components/home/ContinueBrowsing";
import RecentFinds from "@/components/home/RecentFinds";
import { CatalogView } from "@/components/catalog-view";
import { siteConfig } from "@/config/site";

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
  // Refill anything that's been sold out long enough BEFORE reading the
  // catalog, so this build of the page already reflects it.
  await runAutoRestock();
  const settings = await getSiteSettings();
  const rawCatalog = await db.select().from(products);
  const catalog = await attachRatings(rawCatalog);
  // Products the admin ticked as "Featured" (up to 8); if none are ticked,
  // fall back to the first four so the row is never empty.
  const picked = catalog.filter((p) => p.featured);
  const featured = picked.length > 0 ? picked.slice(0, 8) : catalog.slice(0, 4);
  // Figures for the "Our impact" cards, worked out from the real catalog.
  const plasticKg =
    Math.round(catalog.reduce((sum, p) => sum + Number(p.plasticWeightKg || 0), 0) * 10) / 10;

  // Tells Google the site's name is "EcoFurnish" (not the shared host name
  // "de5.net" it falls back to). Google only reads this from the home page;
  // keep `name` and the page title consistent. See Google's "site names"
  // docs.
  const siteNameJsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    alternateName: ["Eco Furnish"],
    url: `${siteConfig.url}/`,
  }).replace(/</g, "\\u003c");

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: siteNameJsonLd }}
      />
      <Hero />

      <ContinueBrowsing />

      <FeaturedProducts products={featured} />

      <RecentFinds />

      <Categories />

      <div id="all-products" className="container mx-auto max-w-7xl scroll-mt-24 px-4 py-12 sm:py-16">
        <SectionHeading
          title="All products"
          subtitle="Sustainable furniture that cleans our streets."
        />

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

      {settings.adBanner && <AdBanner videoSrc="/ads/ad-1.mp4" posterSrc="/ads/ad-1-poster.jpg" />}

      <ImpactCards plasticKg={plasticKg} pieces={catalog.length} />

      {settings.testimonials && <Testimonials />}
      {settings.newsletter && <Newsletter />}
    </main>
  );
}
