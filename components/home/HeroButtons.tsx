import Link from "next/link";

// One clear action. A second button next to it only splits attention.
export default function HeroButtons() {
  return (
    <div className="mt-8">
      <Link
        href="/#all-products"
        className="inline-flex h-12 items-center rounded-md bg-primary px-7 text-base font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Shop the collection
      </Link>
    </div>
  );
}
