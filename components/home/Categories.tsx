import { CATEGORIES } from "@/data/categories";
import SectionHeading from "./SectionHeading";
import CategoryCard from "./CategoryCard";

export default function Categories() {
  return (
    <section id="categories" className="py-10 md:py-16">
      <div className="container mx-auto max-w-7xl px-4">
        <SectionHeading title="Shop by Room" href="/#all-products" />

        <div className="grid grid-cols-3 gap-3 sm:gap-6 lg:max-w-4xl">
          {CATEGORIES.map((category) => (
            <CategoryCard key={category.id} title={category.title} image={category.image} />
          ))}
        </div>
      </div>
    </section>
  );
}
