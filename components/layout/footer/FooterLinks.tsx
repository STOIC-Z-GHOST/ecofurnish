import Link from "next/link";
import { FOOTER_LINKS } from "@/data/footer-links";

export default function FooterLinks() {
  return (
    <div className="grid grid-cols-2 gap-10">
      <div>
        <h2 className="mb-4 font-semibold text-foreground">
          Shop
        </h2>

        <div className="space-y-2">
          {FOOTER_LINKS.shop.map((link) => (
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

      <div>
        <h2 className="mb-4 font-semibold text-foreground">
          Company
        </h2>

        <div className="space-y-2">
          {FOOTER_LINKS.company.map((link) => (
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
    </div>
  );
}