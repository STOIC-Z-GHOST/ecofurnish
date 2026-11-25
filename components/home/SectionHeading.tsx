import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  /** When set, the whole heading is a link with a chevron at the far end
   * (like "Score the top PCs & Accessories >" on Amazon). */
  href?: string;
  /** Small outlined tag next to the title, e.g. "Demo data". */
  badge?: string;
}

// Big, bold, left aligned: the heading is what tells a visitor where they
// are on the page, so it gets the most weight in each section.
export default function SectionHeading({ title, subtitle, href, badge }: SectionHeadingProps) {
  const heading = (
    <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
      {title}
    </h2>
  );

  return (
    <div className="mb-6 sm:mb-10">
      {href ? (
        <Link href={href} className="group flex items-center justify-between gap-4">
          {heading}
          <ChevronRight
            className="size-7 shrink-0 text-foreground transition-transform group-hover:translate-x-1 sm:size-9"
            aria-hidden="true"
          />
        </Link>
      ) : badge ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {heading}
          <span className="rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            {badge}
          </span>
        </div>
      ) : (
        heading
      )}

      {subtitle && (
        <p className="mt-2 max-w-2xl text-base text-muted-foreground sm:mt-3 sm:text-lg">
          {subtitle}
        </p>
      )}
    </div>
  );
}
