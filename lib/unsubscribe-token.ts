import { createHmac, timingSafeEqual } from "crypto";

// Unsubscribe links carry a signature so that only someone who actually
// received the email can use them. Before this, the link was just
// ?email=someone@example.com, so anyone could unsubscribe any address by
// typing a URL.
//
// The signature is an HMAC of the address under a server-only secret (the
// same one Better Auth already needs), with a fixed prefix so it can never
// be confused with any other signature made from that secret.

function secret(): string {
  const value = process.env.BETTER_AUTH_SECRET ?? process.env.AUTH_SECRET;
  if (value) return value;
  if (process.env.NODE_ENV !== "production") return "development-only-unsubscribe-secret";
  throw new Error("BETTER_AUTH_SECRET is not set — can't sign unsubscribe links.");
}

function sign(email: string): string {
  return createHmac("sha256", secret())
    .update(`newsletter-unsubscribe:${email.trim().toLowerCase()}`)
    .digest("hex");
}

/** Path + query for a signed unsubscribe link; prefix it with the site URL. */
export function unsubscribePath(email: string): string {
  return `/api/newsletter/unsubscribe?email=${encodeURIComponent(email)}&token=${sign(email)}`;
}

export function isValidUnsubscribeToken(email: string, token: string | null): boolean {
  if (!token) return false;
  const given = Buffer.from(token, "utf8");
  const expected = Buffer.from(sign(email), "utf8");
  return given.length === expected.length && timingSafeEqual(given, expected);
}
