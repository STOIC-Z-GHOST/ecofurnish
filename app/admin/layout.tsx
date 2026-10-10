import { requireAdminPage } from "@/lib/require-admin";
import { APP_VERSION } from "@/lib/version";
import { AutoRefresh } from "@/components/AutoRefresh";
import { GlowNav, type GlowNavLink } from "@/components/GlowNav";

const ADMIN_LINKS: GlowNavLink[] = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/inbox", label: "Inbox" },
  { href: "/admin/broadcast", label: "Broadcast" },
  { href: "/admin/dispatchers", label: "Dispatchers" },
  { href: "/admin/telegram", label: "Telegram Access" },
  { href: "/dispatcher", label: "Dispatcher Panel ↗" },
];

// requireAdminPage() already calls headers(), which normally opts a route
// out of static caching automatically — this makes that explicit and
// unconditional, so nothing (Vercel's edge cache, the Next.js Data
// Cache) can ever serve a stale snapshot of this section.
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminPage();

  return (
    <div className="container mx-auto max-w-6xl px-4 py-10">
      <AutoRefresh />
      <div className="mb-8 border-b border-border/60 pb-4">
        <h1 className="mb-3 text-xl font-bold tracking-tight">
          Admin <span className="align-middle text-xs font-normal text-muted-foreground">v{APP_VERSION}</span>
        </h1>
        <GlowNav links={ADMIN_LINKS} />
      </div>
      {children}
    </div>
  );
}
