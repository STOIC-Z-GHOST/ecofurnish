import Link from "next/link";

interface FooterLinkColumnProps {
  title: string;
  links: { title: string; href: string }[];
}

// One column of footer links — Footer.tsx renders this once per group
// (Shop, Company, Legal) so each gets its own grid cell instead of two
// groups being crammed side by side in a single narrow column.
export default function FooterLinks({ title, links }: FooterLinkColumnProps) {
  return (
    <div>
      <h2 className="mb-4 font-semibold text-foreground">{title}</h2>

      <div className="space-y-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="block text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            {link.title}
          </Link>
        ))}
      </div>
    </div>
  );
}
