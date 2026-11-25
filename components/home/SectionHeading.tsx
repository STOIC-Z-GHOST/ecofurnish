import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  /** When set, the whole title is a link with an arrow (Amazon style). */
  href?: string;
}

export default function SectionHeading({ title, subtitle, href }: SectionHeadingProps) {
  const heading = (
    <h2 className="flex items-center gap-1 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
      {title}
      {href && <ChevronRight className="mt-1 h-7 w-7 shrink-0 md:h-8 md:w-8" aria-hidden="true" />}
    </h2>
  );

  return (
    <div className="mb-6 md:mb-10">
      {href ? (
        <Link href={href} className="inline-block transition-colors hover:text-primary">
          {heading}
        </Link>
      ) : (
        heading
      )}
      {subtitle && <p className="mt-2 max-w-2xl text-muted-foreground md:text-lg">{subtitle}</p>}
    </div>
  );
}
