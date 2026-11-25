import Image from "next/image";
import Link from "next/link";
import { HOME_HERO } from "@/config/site";

/**
 * One big lifestyle photo, one headline, one button. Nothing else, so the
 * first screen feels calm and the call to action is obvious.
 */
export default function Hero() {
  return (
    <section className="relative isolate flex min-h-[72svh] items-end overflow-hidden md:min-h-[80vh]">
      <Image
        src={HOME_HERO.src}
        alt={HOME_HERO.alt}
        fill
        priority
        sizes="100vw"
        className="-z-10 object-cover"
      />
      {/* Dark gradient so the white headline stays readable on any photo */}
      <div className="absolute inset-0 -z-10 bg-linear-to-t from-black/80 via-black/35 to-black/10" />

      <div className="mx-auto w-full max-w-7xl px-5 pb-12 pt-32 sm:px-8 md:pb-20">
        <p className="text-sm font-medium tracking-wide text-white/80 uppercase">
          Made in Addis Ababa
        </p>
        <h1 className="mt-3 max-w-2xl text-4xl leading-[1.1] font-bold text-white sm:text-5xl md:text-6xl">
          Rooms made from what used to be thrown away.
        </h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-white/85 md:text-lg">
          Furniture from recycled plastic and reclaimed wood, finished by hand and delivered across
          Ethiopia.
        </p>
        <Link
          href="/#all-products"
          className="mt-8 inline-flex h-12 items-center rounded-md bg-white px-7 text-base font-medium text-zinc-900 transition-colors hover:bg-zinc-100"
        >
          Shop the Collection
        </Link>
      </div>
    </section>
  );
}
