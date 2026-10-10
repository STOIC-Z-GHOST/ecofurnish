import { cache } from "react";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
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
