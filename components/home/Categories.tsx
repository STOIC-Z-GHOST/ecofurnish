import { CATEGORIES } from "@/data/categories";
import SectionHeading from "./SectionHeading";
import CategoryCard from "./CategoryCard";

export default function Categories() {
  return (
    <section id="categories" className="py-12 sm:py-20">
      <div className="container mx-auto max-w-7xl px-4">
        <SectionHeading title="Shop by room" href="/#all-products" />

        <div className="grid grid-cols-3 gap-3 sm:gap-6 lg:gap-8">
          {CATEGORIES.map((category) => (
            <CategoryCard
              key={category.id}
              title={category.title}
              image={category.image}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
