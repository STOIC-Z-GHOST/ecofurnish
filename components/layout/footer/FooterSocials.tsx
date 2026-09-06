import Link from "next/link";
import { FaFacebookF, FaInstagram, FaXTwitter } from "react-icons/fa6";
import { siteConfig } from "@/config/site";

const SOCIALS = [
  { href: siteConfig.links.instagram, icon: FaInstagram, label: "Instagram" },
  { href: siteConfig.links.linkedin, icon: FaFacebookF, label: "Facebook" },
  { href: siteConfig.links.github, icon: FaXTwitter, label: "X (Twitter)" },
].filter((s) => s.href);

export default function FooterSocials() {
  if (SOCIALS.length === 0) return null;

  return (
    <div className="flex gap-4">
      {SOCIALS.map(({ href, icon: Icon, label }) => (
        <Link
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          className="rounded-full border border-border p-2 text-foreground transition-colors hover:border-primary hover:text-primary"
        >
          <Icon size={18} />
        </Link>
      ))}
    </div>
  );
}
