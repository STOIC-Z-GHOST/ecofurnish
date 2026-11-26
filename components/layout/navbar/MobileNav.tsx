"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  Home as HomeIcon,
  ShoppingBag,
  LayoutGrid,
  Leaf,
  Mail,
  ChevronRight,
  ChevronDown,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { navigation } from "@/config/navigation";
import { useSession } from "@/lib/auth-client";
import Logo from "./Logo";

// Icon + display order for the mobile drawer specifically — the shared
// `navigation` config (also used by the desktop nav) keeps its own order,
// this just controls how this one drawer presents the same links.
const ICONS: Record<string, typeof HomeIcon> = {
  Home: HomeIcon,
  Shop: ShoppingBag,
  Collections: LayoutGrid,
  About: Leaf,
  Contact: Mail,
};
const MOBILE_ORDER = ["Home", "Shop", "Collections", "About", "Contact"];

export default function MobileNav({ categories }: { categories: string[] }) {
  const [open, setOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";

  const items = [...navigation].sort(
    (a, b) => MOBILE_ORDER.indexOf(a.title) - MOBILE_ORDER.indexOf(b.title)
  );

  // Same fix as MobileBottomNav: Shop ("/#all-products") and Collections
  // ("/#categories") share a pathname with Home ("/"). Next's Link only
  // does a real navigation when the pathname itself changes, so tapping
  // one of these while already on "/" can silently no-op instead of
  // scrolling. Handle that case manually; let Link handle real page changes.
  const handleItemClick = (e: React.MouseEvent, href: string) => {
    setOpen(false);
    const [path, hash] = href.split("#");
    const targetPath = path || "/";
    if (pathname !== targetPath) return; // real navigation — let Link handle it

    e.preventDefault();
    if (hash) {
      document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
      window.history.replaceState(null, "", `${targetPath}#${hash}`);
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
      window.history.replaceState(null, "", targetPath);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu" />}
      >
        <Menu className="h-5 w-5" />
      </DialogTrigger>

      <DialogContent
        showCloseButton={false}
        className="left-0 top-0 flex h-dvh w-4/5 max-w-none translate-x-0 translate-y-0 flex-col rounded-none border-0 p-0 shadow-2xl data-open:slide-in-from-left data-closed:slide-out-to-left sm:max-w-sm"
      >
        <DialogTitle className="sr-only">Menu</DialogTitle>
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-border/60 px-4">
          <div onClick={() => setOpen(false)}>
            <Logo />
          </div>
          <DialogClose render={<Button variant="ghost" size="icon" aria-label="Close menu" />}>
            <X className="h-5 w-5" />
          </DialogClose>
        </div>

        <nav aria-label="Mobile navigation" className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-2">
            {items.map((item) => {
              const Icon = ICONS[item.title] ?? LayoutGrid;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={(e) => handleItemClick(e, item.href)}
                    className="flex items-center gap-3 rounded-xl bg-emerald-100/80 px-4 py-3.5 text-base font-medium text-foreground transition-colors hover:bg-emerald-100"
                  >
                    <Icon className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
                    <span className="flex-1">{item.title}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                </li>
              );
            })}

            {categories.length > 0 && (
              <li>
                <button
                  type="button"
                  onClick={() => setCategoriesOpen((v) => !v)}
                  aria-expanded={categoriesOpen}
                  className="flex w-full items-center gap-3 rounded-xl bg-emerald-100/80 px-4 py-3.5 text-base font-medium text-foreground transition-colors hover:bg-emerald-100"
                >
                  <LayoutGrid className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
                  <span className="flex-1 text-left">Categories</span>
                  <ChevronDown
                    className={`h-4 w-4 text-muted-foreground transition-transform ${
                      categoriesOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {categoriesOpen && (
                  <ul className="mt-1 space-y-1 pl-4">
                    {categories.map((category) => (
                      <li key={category}>
                        {/* Plain Link, no handleItemClick — this genuinely
                            changes the ?category= search param even when
                            already on "/", which Link already handles
                            correctly on its own; the special same-page
                            hash-scroll logic above is only for the
                            hash-only links like "/#all-products". */}
                        <Link
                          href={`/?category=${encodeURIComponent(category)}#all-products`}
                          onClick={() => setOpen(false)}
                          className="flex items-center justify-between rounded-lg px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                          {category}
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            )}

            {isAdmin && (
              <li>
                <Link
                  href="/admin"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-xl bg-emerald-100/80 px-4 py-3.5 text-base font-medium text-foreground transition-colors hover:bg-emerald-100"
                >
                  <ShieldCheck className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
                  <span className="flex-1">Admin</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              </li>
            )}
          </ul>
        </nav>

        {/* Decorative footer — matches the drawer's brand personality
            without adding more functional content to an already-simple menu. */}
        <div className="relative shrink-0 overflow-hidden border-t border-border/60 px-6 py-6">
          <svg
            viewBox="0 0 300 60"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-x-0 top-0 h-12 w-full text-emerald-700 dark:text-emerald-400/10"
          >
            <path
              d="M0 40 C 60 10, 120 55, 180 25 S 260 45, 300 15"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
          <div className="relative flex items-center gap-2">
            <Leaf className="h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-400" />
            <p className="text-sm text-muted-foreground">
              Sustainable living, thoughtfully designed.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
