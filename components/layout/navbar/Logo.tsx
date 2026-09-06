import Link from "next/link";
import { Leaf } from "lucide-react";
import { siteConfig } from "@/config/site";

export default function Logo() {
  return (
    <Link
      href="/"
      className="group flex items-center gap-2 transition-all duration-300 sm:gap-3"
      aria-label="Go to homepage"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-emerald-700 to-green-500 text-white shadow-md transition-transform duration-300 group-hover:scale-105 sm:h-11 sm:w-11">
        <Leaf className="h-4 w-4 sm:h-5 sm:w-5" />
      </div>

      <div className="leading-tight">
        <h1 className="text-lg font-bold tracking-tight sm:text-xl">
          <span className="text-foreground">{siteConfig.brand.first}</span>
          <span className="text-primary">{siteConfig.brand.second}</span>
        </h1>

        <p className="hidden text-xs text-muted-foreground sm:block">
          Sustainable Living
        </p>
      </div>
    </Link>
  );
}
