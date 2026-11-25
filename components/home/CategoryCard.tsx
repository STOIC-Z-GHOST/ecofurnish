import Image from "next/image";
import Link from "next/link";

interface CategoryCardProps {
  title: string;
  image: string;
}

// A perfect square picture with the name underneath. No buttons, no
// overlay, nothing else competing for attention.
export default function CategoryCard({ title, image }: CategoryCardProps) {
  return (
    <Link
      href={`/?room=${encodeURIComponent(title)}#all-products`}
      className="group block"
    >
      <div className="relative aspect-square overflow-hidden rounded-xl bg-white">
        <Image
          src={image}
          alt=""
          fill
          sizes="(max-width: 640px) 33vw, (max-width: 1280px) 30vw, 380px"
          className="object-cover"
        />
      </div>

      <h3 className="mt-2 font-sans text-sm font-medium text-foreground group-hover:underline group-hover:underline-offset-4 sm:mt-3 sm:text-lg">
        {title}
      </h3>
    </Link>
  );
}
