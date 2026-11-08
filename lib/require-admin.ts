import { cache } from "react";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/db";
import { adminGuests } from "@/db/schema";
import { auth } from "@/lib/auth";

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
      .select()
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

export const getAdminAccess = cache(async () => {
  const session = await getSessionOncePerRequest();
  if (!session?.user) return null;
  if (session.user.role === "admin") {
    return { level: "admin" as const, session, guestExpiresAt: null as Date | null };
  }
  // Sign-in already requires a verified email; checked again here so a
  // guest grant can never be claimed by someone who merely typed the address.
  if (session.user.emailVerified !== true) return null;
  const grant = await getGuestGrant(session.user.email);
  if (!grant) return null;
  return { level: "guest" as const, session, guestExpiresAt: grant.expiresAt as Date | null };
});

/**
 * Like requireAdminPage, but ALSO lets an active guest in. Use it only on
 * pages that make sense read-only (dashboard, products list, orders) —
 * and mask customer data on them when isGuest is true. Every other admin
 * page keeps requireAdminPage, so guests get "Page not found" there: new
 * pages are admin-only unless someone deliberately opts them in.
 */
export async function requireAdminViewPage() {
  const access = await getAdminAccess();
  if (!access) notFound();
  return {
    session: access.session,
    isGuest: access.level === "guest",
    guestExpiresAt: access.guestExpiresAt,
  };
}
