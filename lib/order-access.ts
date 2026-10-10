/**
 * Who is allowed to see an order's details (name, email, address, items)?
 *
 *  - an admin (the admin panel links to the order page), or
 *  - the account that placed it (orders.userId), or
 *  - for older guest orders that have no userId: an account whose VERIFIED
 *    email matches the email on the order.
 *
 * Everyone else — other customers, logged-out visitors — gets nothing. An
 * order's UUID is hard to guess but it isn't a password: it shows up in
 * admin screens, screenshots, browser history and shared links, so knowing
 * it must never be enough on its own to read someone's personal data.
 */
export function canViewOrder(
  order: { userId: string | null; customerEmail: string },
  user: { id: string; email?: string | null; emailVerified?: boolean | null; role?: string | null }
): boolean {
  if (user.role === "admin") return true;
  if (order.userId) return order.userId === user.id;
  return (
    Boolean(user.emailVerified) &&
    Boolean(user.email) &&
    user.email!.trim().toLowerCase() === order.customerEmail.trim().toLowerCase()
  );
}
