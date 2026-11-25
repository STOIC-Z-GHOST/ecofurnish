import Image from "next/image";
import Link from "next/link";

interface CategoryCardProps {
  title: string;
  image: string;
}

/** A square picture with the name underneath. No buttons, no clutter. */
export default function CategoryCard({ title, image }: CategoryCardProps) {
  return (
    <Link href={`/?room=${encodeURIComponent(title)}#all-products`} className="group block">
      <div className="relative aspect-square overflow-hidden rounded-md bg-muted">
        <Image
          src={image}
          alt=""
          fill
          sizes="(max-width: 640px) 33vw, (max-width: 1024px) 30vw, 280px"
          className="object-cover"
        />
      </div>
      <h3 className="mt-2 font-sans text-sm font-medium text-foreground transition-colors group-hover:text-primary md:text-base">
        {title}
      </h3>
    </Link>
  );
}
