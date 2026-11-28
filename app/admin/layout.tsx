import { requireAdminShell, type GuestFeature } from "@/lib/require-admin";
import { getSiteSettings } from "@/lib/site-settings";
import { SandboxBanner } from "@/components/admin/sandbox/SandboxBanner";
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
  { href: "/admin/pages", label: "Pages" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/guests", label: "Guests" },
  { href: "/dispatcher", label: "Dispatcher Panel ↗" },
];

// What a read-only guest sees in the menu. Their other admin URLs 404
// anyway (those pages check for a real admin themselves).
// Which of them show is up to the owner (Admin > Settings > Guest admin access).
const GUEST_LINKS: (GlowNavLink & { feature: GuestFeature })[] = [
  { href: "/admin", label: "Dashboard", exact: true, feature: "guestDashboard" },
  { href: "/admin/products", label: "Products", feature: "guestProducts" },
  { href: "/admin/orders", label: "Orders", feature: "guestOrders" },
  { href: "/admin/settings", label: "Settings", feature: "guestSettings" },
];

// An access manager (someone allowed to invite guests) sees only this.
const GUESTS_LINK: GlowNavLink = { href: "/admin/guests", label: "Guests" };

// requireAdminPage() already calls headers(), which normally opts a route
// out of static caching automatically — this makes that explicit and
// unconditional, so nothing (Vercel's edge cache, the Next.js Data
// Cache) can ever serve a stale snapshot of this section.
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Admins, active guests and access managers get the shell; each page then
  // decides for itself who may see it (guests only reach the read-only
  // ones, managers only the Guests page).
  const { level, isGuest, guestExpiresAt, delegate } = await requireAdminShell();
  const settings = await getSiteSettings();
  const guestLinks: GlowNavLink[] = GUEST_LINKS.filter((l) => settings[l.feature]).map(
    ({ feature, ...link }) => {
      void feature;
      return link;
    }
  );
  const links =
    level === "admin"
      ? ADMIN_LINKS
      : level === "guest"
        ? delegate
          ? [...guestLinks, GUESTS_LINK]
          : guestLinks
        : [GUESTS_LINK];

  return (
    <div className="container mx-auto max-w-6xl px-4 py-10">
      <AutoRefresh />
      <div className="mb-8 border-b border-border/60 pb-4">
        <h1 className="mb-3 text-xl font-bold tracking-tight">
          Admin <span className="align-middle text-xs font-normal text-muted-foreground">v{APP_VERSION}</span>
        </h1>
        <GlowNav links={links} />
      </div>
      {isGuest && <SandboxBanner expiresAtIso={guestExpiresAt ? guestExpiresAt.toISOString() : null} />}
      {children}
    </div>
  );
}
