import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About the maker",
  description: "Who started EcoFurnish and why.",
};

export default function AboutTheMakerPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-12 md:py-20">
      <h1 className="text-4xl font-bold tracking-tight md:text-5xl">About the maker</h1>

      <p className="mt-6 text-lg leading-8">
        Hi, I&apos;m Nahom. I started EcoFurnish because I wanted to stop good wood from going to
        waste. Every piece is hand-sanded and finished by our team in Addis Ababa, then delivered to
        your door.
      </p>

      <p className="mt-4 leading-7 text-muted-foreground">
        EcoFurnish is a conceptual e-commerce platform designed to showcase modern, sustainable
        furniture retail.
      </p>

      <div className="mt-10 rounded-lg border border-border bg-card p-5">
        <h2 className="text-xl font-bold">Curious how it was built?</h2>
        <p className="mt-2 text-muted-foreground">
          The design choices, the tech stack and the three months behind this store are on their own
          page.
        </p>
        <Link
          href="/how-its-made"
          className="mt-4 inline-flex h-10 items-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          See how it&apos;s made
        </Link>
      </div>
    </div>
  );
}
