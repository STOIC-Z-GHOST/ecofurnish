"use client";

import ProductCard from "@/components/product/ProductCard";
import SectionHeading from "./SectionHeading";
import { Product } from "@/types/product";
import { useCurrency } from "@/lib/currency-context";

// Takes real products in as a prop (fetched from the database by the
// server component that renders this) rather than importing static data,
// so "featured" always reflects actual current inventory.
export default function FeaturedProducts({ products }: { products: Product[] }) {
  const { currency } = useCurrency();

  if (products.length === 0) return null;

  return (
    <section id="shop" className="py-12 sm:py-20">
      <div className="container mx-auto max-w-7xl px-4">
        <SectionHeading
          title="Featured products"
          subtitle="Our current favorites, ready to ship from Addis Ababa."
          href="/#all-products"
        />

        {/* 2 columns on phones, 4 on desktop. Square picture, name, price,
            then the button, in that order on every card. */}
        <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4 lg:gap-8">
          {products.map((product, index) => (
            <div
              key={product.id}
              className="animate-in fade-in-0 slide-in-from-bottom-3 fill-mode-backwards duration-500"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <ProductCard product={product} currency={currency} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
