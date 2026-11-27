import Link from "next/link";

interface FooterLinkColumnProps {
  title: string;
  links: { title: string; href: string }[];
}

// One column of footer links. Footer.tsx renders this once per group
// (Shop, Company, Legal) so each gets its own grid cell instead of two
// groups being crammed side by side in a single narrow column.
export default function FooterLinks({ title, links }: FooterLinkColumnProps) {
  return (
    <div>
      <h2 className="mb-4 font-sans text-base font-semibold text-foreground">{title}</h2>

      {/* items-start keeps each link only as wide as its own text, so the
          empty space beside a link is not clickable. */}
      <div className="flex flex-col items-start gap-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="py-1 text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            {link.title}
          </Link>
        ))}
      </div>
    </div>
  );
}
