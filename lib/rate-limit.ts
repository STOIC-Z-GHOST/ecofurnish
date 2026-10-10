import { headers } from "next/headers";

// Simple sliding-window limiter, kept in this server instance's memory.
//
// Honest limits of this approach: on Vercel each warm serverless instance
// has its own copy of this map, so a determined attacker spread across many
// instances gets more than `limit` requests through, and the counts reset
// whenever an instance is recycled. It reliably stops casual abuse and
// scripted floods from one place, which is what it's for — it is NOT a
// substitute for a Vercel Firewall rate-limit rule (Project → Firewall),
// which is enforced before your code runs and is the real defence.
const hits = new Map<string, number[]>();

/**
 * Returns true if this caller may proceed, false if they've exceeded
 * `limit` calls to `action` within the last `windowMs`.
 */
export async function allowRequest(action: string, limit: number, windowMs: number): Promise<boolean> {
  const h = await headers();
  // Vercel overwrites x-forwarded-for with the real client address, so
  // the first entry can be trusted there.
  const ip = (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "unknown").trim();
  const key = `${action}:${ip}`;
  const now = Date.now();

  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);

  // Keep the map from growing forever on a long-lived instance.
  if (hits.size > 5000) {
    for (const [k, times] of hits) {
      if (times.every((t) => now - t >= windowMs)) hits.delete(k);
    }
  }
  return true;
}

// Deliberately simple: catches obvious junk without rejecting real (even
// unusual) addresses. Real validity is proven by the email actually arriving.
const EMAIL_PATTERN = /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/;
export function isPlausibleEmail(value: string): boolean {
  return value.length <= 254 && EMAIL_PATTERN.test(value);
}
