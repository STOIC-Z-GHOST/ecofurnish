import Link from "next/link";
import { APP_VERSION } from "@/lib/version";
import { siteConfig } from "@/config/site";

export default function FooterBottom() {
  return (
    <div className="mt-16 flex flex-col items-center gap-1 border-t border-border pt-6 text-center text-sm text-muted-foreground">
      <span>© {new Date().getFullYear()} EcoFurnish. All rights reserved.</span>
      <Link
        href={siteConfig.developer.github}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        Designed &amp; built by {siteConfig.developer.name}
      </Link>
      <span className="text-xs text-muted-foreground">v{APP_VERSION}</span>
    </div>
  );
}
