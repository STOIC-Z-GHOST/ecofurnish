import crypto from "crypto";

/** Long, unguessable bearer token for a driver's status-portal magic
 * link — scoped to a single deliveryAssignments row (see db/schema.ts). */
export function generateMagicToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/** 6-digit code the buyer receives by email and the driver collects in
 * person to submit a "delivered" claim. */
export function generateBuyerPin(): string {
  // crypto.randomInt, not Math.random(): Math.random() is predictable, and this
  // PIN is the only thing standing between a driver and a "delivered" claim.
  return crypto.randomInt(100000, 1000000).toString();
}

export function driverPortalUrl(token: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${base}/driver/${token}`;
}
