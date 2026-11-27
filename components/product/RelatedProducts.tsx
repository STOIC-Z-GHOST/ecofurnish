"use client";

import { Product } from "@/types/product";
import { useCurrency } from "@/lib/currency-context";
import ProductCard from "./ProductCard";

interface RelatedProductsProps {
  products: Product[];
  category: string;
}

export default function RelatedProducts({ products, category }: RelatedProductsProps) {
  const { currency } = useCurrency();

  if (products.length === 0) return null;

  return (
    <section className="mt-14 sm:mt-24">
      <h2 className="text-2xl font-bold tracking-tight">You might also like</h2>
      <p className="mt-1 text-muted-foreground">More from {category}</p>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:gap-6 lg:grid-cols-4">
        {products.map((item) => (
          <ProductCard key={item.id} product={item} currency={currency} />
        ))}
      </div>
    </section>
  );
}
