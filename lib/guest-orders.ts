import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { canViewOrder } from "@/lib/order-access";

// Guest checkout: someone who orders without an account gets a signed cookie
// naming that order. The cookie is the "key" to see and pay for THAT order in
// THAT browser, and nothing else: an order id alone never opens an order (see
// lib/order-access.ts). Later, signing up with the same verified email also
// shows the order.

const COOKIE = "eco_guest_orders";
const MAX_ORDERS_KEPT = 10;
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function secret() {
  return process.env.BETTER_AUTH_SECRET || process.env.AUTH_SECRET || "";
}

function sign(orderId: string) {
  return createHmac("sha256", secret()).update(`guest-order:${orderId}`).digest("base64url");
}

async function readEntries(): Promise<string[]> {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  return raw ? raw.split(",").filter(Boolean) : [];
}

/** Remember that this browser placed this guest order. */
export async function grantGuestOrderAccess(orderId: string) {
  if (!secret()) return;
  const entries = (await readEntries()).filter((e) => !e.startsWith(`${orderId}.`));
  entries.push(`${orderId}.${sign(orderId)}`);
  const jar = await cookies();
  jar.set(COOKIE, entries.slice(-MAX_ORDERS_KEPT).join(","), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

/** Did this browser place this guest order? */
export async function hasGuestOrderAccess(orderId: string): Promise<boolean> {
  if (!secret()) return false;
  const expected = Buffer.from(sign(orderId));
  for (const entry of await readEntries()) {
    const dot = entry.indexOf(".");
    if (dot < 1 || entry.slice(0, dot) !== orderId) continue;
    const given = Buffer.from(entry.slice(dot + 1));
    if (given.length === expected.length && timingSafeEqual(given, expected)) return true;
  }
  return false;
}

/**
 * May this visitor see / pay for this order? Signed in: the usual rules
 * (canViewOrder). Either way, a guest order is also open to the browser that
 * placed it. ignoreAdmin: for actions on a customer's behalf (paying), where
 * even an admin must not act as the customer.
 */
export async function canAccessOrder(
  order: { id: string; userId: string | null; customerEmail: string },
  user: Parameters<typeof canViewOrder>[1] | null | undefined,
  options: { ignoreAdmin?: boolean } = {}
): Promise<boolean> {
  if (user && canViewOrder(order, options.ignoreAdmin ? { ...user, role: null } : user)) return true;
  if (order.userId) return false;
  return hasGuestOrderAccess(order.id);
}
