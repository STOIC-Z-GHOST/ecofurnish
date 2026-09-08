import Link from "next/link";
import { Leaf, Recycle, Users } from "lucide-react";
import { siteConfig } from "@/config/site";
import { APP_VERSION } from "@/lib/version";

export default function AboutPage() {
  return (
    <div>
      <section className="border-b border-border/60 bg-muted/30">
        <div className="container mx-auto max-w-4xl px-4 py-20 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
            <Leaf className="h-4 w-4" />
            Our Story
          </span>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl">
            Furniture that cleans our streets
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            EcoFurnish started with a simple question: what if the plastic
            waste piling up around Addis Ababa could become something you&apos;d
            actually want in your living room? Every piece we build answers
            that question a little further.
          </p>
        </div>
      </section>

      <section className="container mx-auto max-w-4xl px-4 py-16">
        {/* Visually hidden — the grid below reads fine without a visible
            section title, but skipping straight from the page's <h1> to
            these <h3> cards with nothing in between is a real heading-order
            violation, not just a style choice. sr-only keeps the design
            exactly as-is while giving screen reader users the same outline
            sighted users get for free from the layout. */}
        <h2 className="sr-only">What we stand for</h2>
        <div className="grid gap-10 sm:grid-cols-3">
          <div>
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Recycle className="h-5 w-5" />
            </span>
            <h3 className="mt-4 font-semibold">Recycled by design</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              We source reclaimed plastic and wood locally, then work with
              small workshops to turn it into furniture built to last —
              not to be replaced next season.
            </p>
          </div>
          <div>
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Leaf className="h-5 w-5" />
            </span>
            <h3 className="mt-4 font-semibold">Transparent impact</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Every product listing shows exactly how much plastic it
              diverted from landfills — no vague &quot;eco-friendly&quot; claims,
              just a real number per item.
            </p>
          </div>
          <div>
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </span>
            <h3 className="mt-4 font-semibold">Made close to home</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Every order ships from Addis Ababa, which keeps delivery
              fast and transport emissions low for customers across
              Ethiopia.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-border/60 bg-muted/30">
        <div className="container mx-auto max-w-2xl px-4 py-16 text-center">
          <h2 className="text-2xl font-bold tracking-tight">
            Want to see it for yourself?
          </h2>
          <p className="mt-3 text-muted-foreground">
            Browse the current catalog, or get in touch if you&apos;re a retailer
            interested in stocking EcoFurnish pieces.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Link
              href="/"
              className="rounded-xl bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Browse the catalog
            </Link>
            <Link
              href="/contact"
              className="rounded-xl border border-border px-6 py-3 font-medium transition-colors hover:bg-muted"
            >
              Contact us
            </Link>
          </div>
        </div>
      </section>

      {/* Deliberately set apart from the brand story above — this is a
          demo/portfolio project, and the credit line belongs here as a
          footnote for anyone curious, not in the storefront's own
          footer where it read like part of the EcoFurnish brand. */}
      <div className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
        This is a demo storefront — designed &amp; built by{" "}
        <a
          href={siteConfig.developer.github}
          target="_blank"
          rel="noopener noreferrer"
          className="underline-offset-2 hover:underline"
        >
          {siteConfig.developer.name}
        </a>
        . v{APP_VERSION}
      </div>
    </div>
  );
}
