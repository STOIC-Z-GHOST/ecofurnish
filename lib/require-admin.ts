import { cache } from "react";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/db";
import { adminDelegates, adminGuests } from "@/db/schema";
import { auth } from "@/lib/auth";
import { getSiteSettings } from "@/lib/site-settings";

/** The Settings switches that decide what a read-only guest may open. */
export type GuestFeature =
  | "guestDashboard"
  | "guestProducts"
  | "guestOrders"
  | "guestInbox"
  | "guestBroadcast"
  | "guestDispatchers"
  | "guestTelegram"
  | "guestPages"
  | "guestSettings"
  | "guestGuests";

// One session lookup per request, shared by the admin layout and the page
// under it (they both call requireAdminPage below), so guarding every page
// doesn't mean an extra DB round-trip per page.
const getSessionOncePerRequest = cache(async () =>
  auth.api.getSession({ headers: await headers() })
);

/**
 * Use at the top of every page AND the layout under /admin.
 *
 * Anyone who isn't a signed-in admin gets the normal "Page not found" page —
 * logged out, logged in as a regular customer, expired session, all the same,
 * so /admin doesn't even confirm that it exists.
 *
 * Why every page and not just the layout: Next.js renders a layout and the
 * page inside it in parallel, and doesn't re-run a layout when moving between
 * pages in the same section. A check that lives only in the layout therefore
 * isn't a reliable gate on the data a page loads — the page has to check for
 * itself, before it touches the database.
 */
export async function requireAdminPage() {
  const session = await getSessionOncePerRequest();
  if (!session?.user || session.user.role !== "admin") notFound();
  return session;
}

/**
 * Call at the top of any admin server action. Unlike pages, actions redirect
 * (sign-in if logged out, homepage if logged in but not an admin) because
 * the admin forms already handle that redirect when a session expires
 * mid-edit — see components/admin/product-form.tsx. To make a user an admin,
 * run `pnpm make-admin <email>`.
 */
export async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/sign-in");
  if (session.user.role !== "admin") redirect("/");
  return session;
}

/**
 * Is the signed-in person an admin, a temporary read-only guest, or neither?
 *
 * A guest is any signed-in user with a verified email address that has a
 * live row in admin_guests (not revoked, not past its expiry) — checked on
 * every request, so access ends by itself at the expiry time and a revoke
 * takes effect immediately. Guests keep their normal "user" role, which is
 * what makes every admin server action refuse them: each one starts with
 * requireAdmin(), and that only lets role "admin" through. Fails closed: if
 * the table can't be read, nobody gets guest access.
 */
const getGuestGrant = cache(async (email: string) => {
  try {
    const [grant] = await db
      .select({ email: adminGuests.email, expiresAt: adminGuests.expiresAt })
      .from(adminGuests)
      .where(
        and(
          eq(adminGuests.email, email.toLowerCase()),
          isNull(adminGuests.revokedAt),
          gt(adminGuests.expiresAt, new Date())
        )
      )
      .limit(1);
    return grant ?? null;
  } catch (error) {
    console.error("Couldn't check guest admin access:", error);
    return null;
  }
});

/**
 * An "access manager": someone the owner trusts to invite temporary
 * read-only guests, with limits the owner chose. Same rules as guests —
 * checked on every request, verified email, fails closed.
 */
const getDelegateGrant = cache(async (email: string) => {
  try {
    const [grant] = await db
      .select({ maxDays: adminDelegates.maxDays, maxActive: adminDelegates.maxActive })
      .from(adminDelegates)
      .where(and(eq(adminDelegates.email, email.toLowerCase()), isNull(adminDelegates.revokedAt)))
      .limit(1);
    return grant ?? null;
  } catch (error) {
    console.error("Couldn't check access-manager status:", error);
    return null;
  }
});

export type DelegateLimits = { maxDays: number; maxActive: number };

/**
 * Who is this, as far as the admin area is concerned?
 *   level "admin"     — a real admin, full access.
 *   level "guest"     — read-only (dashboard, products, orders; masked).
 *   level "delegate"  — an access manager with no guest grant: can ONLY use
 *                       the Guests page, sees nothing else.
 * `delegate` is set whenever the person is an access manager (even if they
 * also hold a guest grant), so they can manage guests either way.
 */
export const getAdminAccess = cache(async () => {
  const session = await getSessionOncePerRequest();
  if (!session?.user) return null;
  if (session.user.role === "admin") {
    return {
      level: "admin" as const,
      session,
      guestExpiresAt: null as Date | null,
      delegate: null as DelegateLimits | null,
    };
  }
  // Sign-in already requires a verified email; checked again here so a
  // grant can never be claimed by someone who merely typed the address.
  if (session.user.emailVerified !== true) return null;
  const [grant, delegate] = await Promise.all([
    getGuestGrant(session.user.email),
    getDelegateGrant(session.user.email),
  ]);
  if (!grant && !delegate) return null;
  return {
    level: (grant ? "guest" : "delegate") as "guest" | "delegate",
    session,
    guestExpiresAt: (grant?.expiresAt ?? null) as Date | null,
    delegate: delegate as DelegateLimits | null,
  };
});

/**
 * For the admin LAYOUT only: lets in admins, active guests and access
 * managers, because all three need the shell. It says who they are; each
 * page then decides for itself whether they may see it.
 */
export async function requireAdminShell() {
  const access = await getAdminAccess();
  if (!access) notFound();
  return {
    session: access.session,
    level: access.level,
    isGuest: access.level === "guest",
    guestExpiresAt: access.guestExpiresAt,
    delegate: access.delegate,
  };
}

/**
 * Like requireAdminPage, but ALSO lets an active guest in. Use it only on
 * pages that make sense read-only (dashboard, products list, orders) —
 * and mask customer data on them when isGuest is true. Every other admin
 * page keeps requireAdminPage, so guests get "Page not found" there: new
 * pages are admin-only unless someone deliberately opts them in.
 */
export async function requireAdminViewPage(feature?: GuestFeature) {
  const access = await getAdminAccess();
  // An access manager with no guest grant is NOT a viewer.
  if (!access || access.level === "delegate") notFound();
  // The owner chooses which admin pages guests may open (Admin > Settings >
  // Guest admin access). A page that is switched off is "not found" for
  // guests. Real admins are never affected.
  if (access.level === "guest" && feature && !(await getSiteSettings())[feature]) notFound();
  return {
    session: access.session,
    isGuest: access.level === "guest",
    guestExpiresAt: access.guestExpiresAt,
  };
}

/**
 * The Guests page: admins, and access managers. (Page version: "not found"
 * for everyone else.)
 */
export async function requireGuestManagerPage() {
  const access = await getAdminAccess();
  if (!access || (access.level !== "admin" && !access.delegate)) notFound();
  return {
    session: access.session,
    isAdmin: access.level === "admin",
    delegate: access.delegate,
  };
}

/**
 * The same for server actions: admins, and access managers. Anyone else is
 * turned away the way requireAdmin turns people away. Returns who is acting
 * and, for a manager, the limits the owner set for them.
 */
export async function requireGuestManager() {
  const access = await getAdminAccess();
  if (!access) redirect("/");
  if (access.level !== "admin" && !access.delegate) redirect("/");
  return {
    session: access.session,
    isAdmin: access.level === "admin",
    delegate: access.delegate,
  };
}
