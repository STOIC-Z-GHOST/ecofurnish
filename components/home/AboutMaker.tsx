import Link from "next/link";

// The body of the "About the maker" page (app/about-the-maker/page.tsx).
export default function AboutMaker() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
        About the maker
      </h1>

      <p className="mt-8 font-heading text-xl leading-9 text-foreground sm:text-2xl sm:leading-10">
        Hi, I&apos;m Nahom. I started EcoFurnish because I wanted to stop good wood from
        going to waste, and to show what a modern, sustainable furniture store could look
        like online.
      </p>

      <p className="mt-5 text-base leading-7 text-muted-foreground">
        EcoFurnish is a conceptual e-commerce platform designed to showcase modern,
        sustainable furniture retail.
      </p>

      <Link
        href="/how-its-made"
        className="mt-8 inline-flex h-11 items-center rounded-md border border-border px-5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
      >
        See how it&apos;s made
      </Link>
    </div>
  );
}
