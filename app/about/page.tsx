import Link from "next/link";
import { Leaf, Recycle, Users } from "lucide-react";
import { siteConfig } from "@/config/site";
import { APP_VERSION } from "@/lib/version";
import { getSitePage, parseAboutContent } from "@/lib/site-pages";

// The wording is editable in Admin -> Pages; this re-checks it every few
// minutes, and saving the page refreshes it immediately.
export const revalidate = 300;

const CARD_ICONS = [Recycle, Leaf, Users];

export default async function AboutPage() {
  const page = await getSitePage("about");
  const about = parseAboutContent(page.body);

  return (
    <div>
      <section className="border-b border-border/60 bg-muted/30">
        <div className="container mx-auto max-w-4xl px-4 py-20 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
            <Leaf className="h-4 w-4" />
            {about.badge}
          </span>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl">
            {about.heading}
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">{about.intro}</p>
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
          {about.cards.map((card, i) => {
            const Icon = CARD_ICONS[i] ?? Leaf;
            return (
              <div key={i}>
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-semibold">{card.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{card.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="border-t border-border/60 bg-muted/30">
        <div className="container mx-auto max-w-2xl px-4 py-16 text-center">
          <h2 className="text-2xl font-bold tracking-tight">{about.ctaHeading}</h2>
          <p className="mt-3 text-muted-foreground">{about.ctaText}</p>
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
