"use server";

import { timingSafeEqual } from "crypto";
import { and, eq, gte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { deliveryClaims } from "@/db/schema";
import { getAssignmentContext, isTokenExpired, NEXT_CLAIM_TYPE, type ClaimType } from "@/lib/driver-portal";
import { haversineDistanceMeters } from "@/lib/haversine";

type Guard =
  | { ok: true; assignment: NonNullable<Awaited<ReturnType<typeof getAssignmentContext>>>["assignment"] }
  | { ok: false; error: string };

// How the delivery PIN is protected from guessing. It's only 6 digits, and
// anyone holding the driver's link can try PINs, so wrong guesses are
// capped: after MAX_PIN_FAILURES wrong tries inside PIN_WINDOW_MS the
// delivery step locks until the window passes. Failed tries are logged as
// delivery_claims rows with status "pin_failed" — deliberately NOT
// "pending", so they never show in the dispatcher's review queue, never
// block a retry, and need no database change.
const MAX_PIN_FAILURES = 5;
const PIN_WINDOW_MS = 30 * 60 * 1000;

function pinsMatch(entered: string, actual: string): boolean {
  const a = Buffer.from(entered, "utf8");
  const b = Buffer.from(actual, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

// Coordinates come straight from the browser (or from anyone calling this
// action directly). Anything that isn't a real lat/lng would otherwise
// throw on .toFixed() or be rejected by the database as a 500.
function isValidCoordinate(lat: unknown, lng: unknown): lat is number {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180
  );
}

async function guardSubmission(token: string, expectedType: ClaimType): Promise<Guard> {
  const context = await getAssignmentContext(token);
  if (!context) return { ok: false, error: "This delivery link isn't valid." };
  const { assignment, order } = context;

  if (assignment.status !== "active") {
    return { ok: false, error: "This delivery is no longer active." };
  }
  if (isTokenExpired(assignment)) {
    return { ok: false, error: "This delivery link has expired." };
  }
  if (NEXT_CLAIM_TYPE[order.status] !== expectedType) {
    return { ok: false, error: "This step isn't available right now — try refreshing the page." };
  }

  const [existingPending] = await db
    .select()
    .from(deliveryClaims)
    .where(
      and(
        eq(deliveryClaims.assignmentId, assignment.id),
        eq(deliveryClaims.claimType, expectedType),
        eq(deliveryClaims.status, "pending")
      )
    )
    .limit(1);
  if (existingPending) {
    return { ok: false, error: "Already submitted — waiting for dispatcher review." };
  }

  return { ok: true, assignment };
}

export async function submitStartedDriving(token: string) {
  const guard = await guardSubmission(token, "started_driving");
  if (!guard.ok) return { success: false as const, error: guard.error };

  await db
    .insert(deliveryClaims)
    .values({ assignmentId: guard.assignment.id, claimType: "started_driving" });

  revalidatePath(`/driver/${token}`);
  return { success: true as const };
}

export async function submitNearDestination(token: string, lat: number, lng: number) {
  const guard = await guardSubmission(token, "near_destination");
  if (!guard.ok) return { success: false as const, error: guard.error };
  if (!isValidCoordinate(lat, lng)) {
    return { success: false as const, error: "We couldn't read your location — please try again." };
  }

  const distanceMeters = haversineDistanceMeters(
    lat,
    lng,
    parseFloat(guard.assignment.deliveryLat),
    parseFloat(guard.assignment.deliveryLng)
  );

  await db.insert(deliveryClaims).values({
    assignmentId: guard.assignment.id,
    claimType: "near_destination",
    driverLat: lat.toFixed(6),
    driverLng: lng.toFixed(6),
    distanceMeters: distanceMeters.toFixed(1),
  });

  revalidatePath(`/driver/${token}`);
  return { success: true as const };
}

export async function submitDelivered(token: string, lat: number, lng: number, pin: string) {
  const guard = await guardSubmission(token, "delivered");
  if (!guard.ok) return { success: false as const, error: guard.error };
  if (!isValidCoordinate(lat, lng) || typeof pin !== "string") {
    return { success: false as const, error: "We couldn't read your location — please try again." };
  }

  const since = new Date(Date.now() - PIN_WINDOW_MS);
  const recentFailures = await db
    .select({ id: deliveryClaims.id })
    .from(deliveryClaims)
    .where(
      and(
        eq(deliveryClaims.assignmentId, guard.assignment.id),
        eq(deliveryClaims.claimType, "delivered"),
        eq(deliveryClaims.status, "pin_failed"),
        gte(deliveryClaims.createdAt, since)
      )
    )
    .limit(MAX_PIN_FAILURES);
  if (recentFailures.length >= MAX_PIN_FAILURES) {
    return {
      success: false as const,
      error: "Too many incorrect PIN attempts. Please wait 30 minutes and try again, or contact your dispatcher.",
    };
  }

  // A wrong PIN never creates a claim at all — the driver just gets
  // told to try again. This is a deliberate simplification from the
  // original "log every attempt" idea: if a mismatch DID create a
  // pending claim, the "no duplicate pending claim" guard above would
  // block the driver from immediately retrying a simple typo until a
  // dispatcher happened to notice and decline it. Verifying before
  // insert keeps the PIN a real access gate instead of a dead end.
  if (!pinsMatch(pin.trim(), guard.assignment.buyerPin)) {
    await db.insert(deliveryClaims).values({
      assignmentId: guard.assignment.id,
      claimType: "delivered",
      status: "pin_failed",
      pinEntered: pin.trim().slice(0, 12),
      pinMatched: false,
    });
    return {
      success: false as const,
      error: "That PIN doesn't match — please double check with the customer.",
    };
  }

  const distanceMeters = haversineDistanceMeters(
    lat,
    lng,
    parseFloat(guard.assignment.deliveryLat),
    parseFloat(guard.assignment.deliveryLng)
  );

  await db.insert(deliveryClaims).values({
    assignmentId: guard.assignment.id,
    claimType: "delivered",
    driverLat: lat.toFixed(6),
    driverLng: lng.toFixed(6),
    distanceMeters: distanceMeters.toFixed(1),
    pinEntered: pin.trim(),
    pinMatched: true,
  });

  revalidatePath(`/driver/${token}`);
  return { success: true as const };
}
