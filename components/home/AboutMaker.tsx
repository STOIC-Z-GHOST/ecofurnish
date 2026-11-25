import Link from "next/link";

export default function AboutMaker() {
  return (
    <section className="py-12 md:py-20">
      <div className="container mx-auto max-w-3xl px-4">
        <h2 className="text-3xl font-bold tracking-tight md:text-4xl">About the maker</h2>
        <p className="mt-5 text-lg leading-8 text-foreground">
          Hi, I&apos;m Nahom. I started EcoFurnish because I wanted to stop good wood from going to
          waste. Every piece is hand-sanded and finished by our team in Addis Ababa, then
          delivered to your door.
        </p>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          EcoFurnish is a conceptual e-commerce platform designed to showcase modern, sustainable
          furniture retail.{" "}
          <Link href="/how-its-made" className="font-medium text-primary underline underline-offset-4">
            See how it&apos;s made
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
