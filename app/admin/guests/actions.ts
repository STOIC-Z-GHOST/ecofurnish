"use server";

import { revalidatePath } from "next/cache";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { adminGuests } from "@/db/schema";
import { sendOrderNoticeEmail } from "@/lib/email";
import { requireAdmin } from "@/lib/require-admin";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_DAYS = [1, 3, 7, 14, 30];

/**
 * Gives (or renews) read-only guest access to an email address for a fixed
 * number of days. Only a real admin can do this. The person signs in with
 * that address (it must be verified, like any account) and sees the
 * dashboard, products and orders with customer details masked.
 */
export async function grantGuestAccess(emailInput: string, days: number) {
  const session = await requireAdmin();
  const email = emailInput.trim().toLowerCase();
  if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    return { success: false as const, error: "Enter a valid email address." };
  }
  if (!ALLOWED_DAYS.includes(days)) {
    return { success: false as const, error: "Pick one of the listed durations." };
  }
  if (email === session.user.email.toLowerCase()) {
    return { success: false as const, error: "You're already an admin." };
  }

  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  try {
    await db
      .insert(adminGuests)
      .values({ email, expiresAt, grantedBy: session.user.email })
      .onConflictDoUpdate({
        target: adminGuests.email,
        // Granting again renews it and clears an earlier revoke.
        set: { expiresAt, grantedBy: session.user.email, revokedAt: null },
      });
  } catch (error) {
    console.error("Couldn't save guest access:", error);
    return {
      success: false as const,
      error: "Couldn't save — has the admin_guests table been created in the database?",
    };
  }

  await sendOrderNoticeEmail({
    toEmail: email,
    subject: "You've been given read-only access to the EcoFurnish admin",
    paragraphs: [
      "Hi,",
      `You've been given read-only access to the EcoFurnish admin dashboard until ${expiresAt.toUTCString()}.`,
      "Sign in with this email address (create an account and verify it first if you don't have one). You'll be able to look at the dashboard, products and orders. Customer details are masked and nothing can be changed.",
    ],
    cta: { label: "Open the admin", path: "/admin" },
  });

  revalidatePath("/admin/guests");
  return { success: true as const };
}

/** Cuts a guest off immediately (they keep their normal account). */
export async function revokeGuestAccess(emailInput: string) {
  await requireAdmin();
  const email = emailInput.trim().toLowerCase();
  await db
    .update(adminGuests)
    .set({ revokedAt: new Date() })
    .where(and(eq(adminGuests.email, email), isNull(adminGuests.revokedAt)));
  revalidatePath("/admin/guests");
  return { success: true as const };
}

/** Removes a finished or revoked entry from the list. */
export async function deleteGuestAccess(emailInput: string) {
  await requireAdmin();
  await db.delete(adminGuests).where(eq(adminGuests.email, emailInput.trim().toLowerCase()));
  revalidatePath("/admin/guests");
  return { success: true as const };
}
