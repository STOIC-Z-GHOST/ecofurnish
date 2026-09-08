import { and, eq, ne } from "drizzle-orm";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { NAV_HOVER_LINK } from "@/components/layout/navbar/nav-hover";
import { db } from "@/db";
import { products } from "@/db/schema";
import { siteConfig } from "@/config/site";
import { auth } from "@/lib/auth";
import { attachRatings, getReviewsForProduct, canReviewProduct, getMyReviewForProduct } from "@/lib/reviews";
import ProductGallery from "@/components/product/details/ProductGallery";
import ProductSummary from "@/components/product/details/ProductSummary";
import ProductReviews from "@/components/product/ProductReviews";
import RelatedProducts from "@/components/product/RelatedProducts";
import { RecordProductView } from "@/components/product/RecordProductView";

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

async function getProductForPage(id: string) {
  const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return product;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductForPage(id);

  // Falls back to the default site metadata (set in app/layout.tsx) if the
  // product doesn't exist — the page itself calls notFound() separately.
  if (!product) return {};

  const title = `${product.name} — ${siteConfig.name}`;
  const description =
    product.description ?? `${product.name}, sustainable furniture from ${siteConfig.name}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: product.imageUrl ? [{ url: product.imageUrl }] : undefined,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: product.imageUrl ? [product.imageUrl] : undefined,
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;

  const product = await getProductForPage(id);
  if (!product) notFound();

  // Same category, excluding this product itself — one indexed query.
  const related = await db
    .select()
    .from(products)
    .where(and(eq(products.category, product.category), ne(products.id, product.id)))
    .limit(4);

  const [[productWithRating], relatedWithRatings, productReviews, session] = await Promise.all([
    attachRatings([product]),
    attachRatings(related),
    getReviewsForProduct(id),
    auth.api.getSession({ headers: await headers() }),
  ]);

  const userId = session?.user?.id;
  const [canReview, myExistingReview] = userId
    ? await Promise.all([canReviewProduct(userId, id), getMyReviewForProduct(userId, id)])
    : [false, null];

  return (
    <main className="container mx-auto px-4 py-20">
      {/* Fixed instead of inline so it's still reachable while scrolled deep
          into the page — same neumorphic pill as the Home/Shop/etc. nav
          buttons (NAV_HOVER_LINK), not a separate one-off style. Sits just
          under the sticky navbar (which is h-16/h-20 + z-50) so it never
          overlaps it.

          !fixed, not plain fixed: NAV_HOVER_LINK's own base styling
          includes `relative` (it needs a positioning context for its own
          hover effects). `.relative` and `.fixed` are equal-specificity
          utilities, and Tailwind generates them alphabetically — so
          `.relative` comes after `.fixed` in the stylesheet and silently
          wins, leaving the button positioned in normal document flow
          instead of pinned to the viewport. The `!` forces this fixed to
          win regardless of generation order, the same reason !inline-flex
          is used below to override NAV_HOVER_LINK's own `block`. */}
      <Link
        href="/"
        className={`${NAV_HOVER_LINK} !fixed left-4 top-[4.5rem] z-40 !inline-flex items-center gap-1.5 sm:left-6 sm:top-24`}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to catalog
      </Link>

      <div className="grid gap-16 lg:grid-cols-2">
        <ProductGallery product={productWithRating} />
        <ProductSummary product={productWithRating} />
      </div>

      <RecordProductView product={productWithRating} />

      <ProductReviews
        productId={id}
        reviews={productReviews}
        canReview={canReview}
        myExistingReview={
          myExistingReview ? { rating: myExistingReview.rating, comment: myExistingReview.comment } : null
        }
      />

      <RelatedProducts products={relatedWithRatings} category={product.category} />
    </main>
  );
}
