import Link from "next/link";

export default function AboutMaker() {
  return (
    <section className="py-12 sm:py-20">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="max-w-3xl">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            About the maker
          </h2>

          <p className="mt-6 font-heading text-xl leading-9 text-foreground sm:text-2xl sm:leading-10">
            Hi, I&apos;m Nahom. I started EcoFurnish because I wanted to stop good wood from
            going to waste. Every piece is hand-sanded and finished by our team in Addis Ababa.
          </p>

          <p className="mt-5 text-base leading-7 text-muted-foreground">
            EcoFurnish is a conceptual e-commerce platform designed to showcase modern,
            sustainable furniture retail.
          </p>

          <Link
            href="/how-its-made"
            className="mt-6 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            See how it&apos;s made
          </Link>
        </div>
      </div>
    </section>
  );
}
