import Link from "next/link";

// One clear action. A second button next to it only splits attention.
export default function HeroButtons() {
  return (
    <div className="mt-6 sm:mt-8">
      <Link
        href="/#all-products"
        className="inline-flex h-12 items-center rounded-md bg-white px-7 text-base font-medium text-[#1B2A22] transition-colors hover:bg-white/90"
      >
        Shop the collection
      </Link>
    </div>
  );
}
