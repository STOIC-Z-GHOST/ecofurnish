"use server";

import { revalidatePath } from "next/cache";
import { and, count, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/db";
import { adminDelegates, adminGuests } from "@/db/schema";
import { sendOrderNoticeEmail } from "@/lib/email";
import { escapeHtml } from "@/lib/escape-html";
import { requireAdmin, requireGuestManager } from "@/lib/require-admin";
import { sendTelegramMessage } from "@/lib/telegram";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_DAYS = [1, 3, 7, 14, 30];
const MAX_ACTIVE_LIMIT = 50;

type Result = { success: true } | { success: false; error: string };

function cleanEmail(input: string): string | null {
  const email = input.trim().toLowerCase();
  return EMAIL_PATTERN.test(email) && email.length <= 254 ? email : null;
}

/**
 * Gives (or renews) read-only guest access to an email address for a fixed
 * number of days.
 *
 * Who may: the owner (any listed duration), or an "access manager" — within
 * the limits the owner set for them (longest stay, most guests at once), and
 * only for people nobody else has already invited. The person signs in with
 * that address (it must be a verified account, like any other) and gets the
 * masked, sandboxed guest view — never anything editable on the real store.
 */
export async function grantGuestAccess(emailInput: string, days: number): Promise<Result> {
  const who = await requireGuestManager();
  const me = who.session.user.email.toLowerCase();

  const email = cleanEmail(emailInput);
  if (!email) return { success: false, error: "Enter a valid email address." };
  if (!ALLOWED_DAYS.includes(days)) {
    return { success: false, error: "Pick one of the listed durations." };
  }
  if (email === me) return { success: false, error: "That's your own address." };

  if (!who.isAdmin) {
    const limits = who.delegate;
    if (!limits) return { success: false, error: "You can't invite guests." };
    if (days > limits.maxDays) {
      return { success: false, error: `You can give guest access for up to ${limits.maxDays} day(s).` };
    }
    try {
      const now = new Date();
      const live = and(eq(adminGuests.grantedBy, me), isNull(adminGuests.revokedAt), gt(adminGuests.expiresAt, now));
      const [{ n }] = await db.select({ n: count() }).from(adminGuests).where(live);
      const [renewing] = await db
        .select({ email: adminGuests.email })
        .from(adminGuests)
        .where(and(eq(adminGuests.email, email), live))
        .limit(1);
      // Renewing someone you already invited doesn't need a free slot.
      if (!renewing && n >= limits.maxActive) {
        return {
          success: false,
          error: `You already have ${n} active guest(s), the limit is ${limits.maxActive}. Revoke one first.`,
        };
      }
    } catch (error) {
      console.error("Couldn't check guest limits:", error);
      return { success: false, error: "Couldn't check your limits, try again." };
    }
  }

  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  try {
    const saved = await db
      .insert(adminGuests)
      .values({ email, expiresAt, grantedBy: me })
      .onConflictDoUpdate({
        target: adminGuests.email,
        // Granting again renews it and clears an earlier revoke. A manager
        // can only renew people THEY invited, never take over another's.
        set: { expiresAt, grantedBy: me, revokedAt: null },
        setWhere: who.isAdmin ? undefined : eq(adminGuests.grantedBy, me),
      })
      .returning({ email: adminGuests.email });
    if (saved.length === 0) {
      return { success: false, error: "That person already has guest access from someone else." };
    }
  } catch (error) {
    console.error("Couldn't save guest access:", error);
    return {
      success: false,
      error: "Couldn't save, has the admin_guests table been created in the database?",
    };
  }

  await sendOrderNoticeEmail({
    toEmail: email,
    subject: "You've been invited to look around the EcoFurnish admin",
    paragraphs: [
      "Hi,",
      `You've been given read-only access to the EcoFurnish admin dashboard until ${expiresAt.toUTCString()}, so you can see what a finished store's back office looks like.`,
      "Sign in with this email address (create an account and verify it first if you don't have one), then open the account menu at the top right and choose \"Guest admin\", or just use the button below. You'll see the dashboard, products and orders. Customer details are masked, and you're free to try changing things, your edits are only saved in your own browser and never touch the real store.",
    ],
    cta: { label: "Open the admin", path: "/admin" },
  });

  // The owner hears about every invite a manager makes.
  if (!who.isAdmin) {
    await sendTelegramMessage(
      `👤 <b>${escapeHtml(me)}</b> gave guest access to <b>${escapeHtml(email)}</b> for ${days} day(s).`
    );
  }

  revalidatePath("/admin/guests");
  return { success: true };
}

/** Cuts a guest off immediately. A manager can only do this to their own invitees. */
export async function revokeGuestAccess(emailInput: string): Promise<Result> {
  const who = await requireGuestManager();
  const me = who.session.user.email.toLowerCase();
  const email = emailInput.trim().toLowerCase();
  const rows = await db
    .update(adminGuests)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(adminGuests.email, email),
        isNull(adminGuests.revokedAt),
        who.isAdmin ? undefined : eq(adminGuests.grantedBy, me)
      )
    )
    .returning({ email: adminGuests.email });
  if (rows.length === 0) return { success: false, error: "Nothing to revoke." };
  revalidatePath("/admin/guests");
  return { success: true };
}

/** Removes a finished or revoked entry from the list (a manager: their own only). */
export async function deleteGuestAccess(emailInput: string): Promise<Result> {
  const who = await requireGuestManager();
  const me = who.session.user.email.toLowerCase();
  const email = emailInput.trim().toLowerCase();
  await db
    .delete(adminGuests)
    .where(
      and(eq(adminGuests.email, email), who.isAdmin ? undefined : eq(adminGuests.grantedBy, me))
    );
  revalidatePath("/admin/guests");
  return { success: true };
}

/**
 * Owner only: makes someone an access manager (or changes their limits).
 * They can invite guests for up to `maxDays` days, `maxActive` at a time —
 * and can do nothing else.
 */
export async function addAccessManager(
  emailInput: string,
  maxDays: number,
  maxActive: number
): Promise<Result> {
  const session = await requireAdmin();
  const email = cleanEmail(emailInput);
  if (!email) return { success: false, error: "Enter a valid email address." };
  if (!ALLOWED_DAYS.includes(maxDays)) return { success: false, error: "Pick one of the listed durations." };
  if (!Number.isInteger(maxActive) || maxActive < 1 || maxActive > MAX_ACTIVE_LIMIT) {
    return { success: false, error: `The guest limit must be 1–${MAX_ACTIVE_LIMIT}.` };
  }
  if (email === session.user.email.toLowerCase()) {
    return { success: false, error: "You're already an admin." };
  }

  try {
    await db
      .insert(adminDelegates)
      .values({ email, maxDays, maxActive, createdBy: session.user.email.toLowerCase() })
      .onConflictDoUpdate({
        target: adminDelegates.email,
        set: { maxDays, maxActive, revokedAt: null },
      });
  } catch (error) {
    console.error("Couldn't save the access manager:", error);
    return {
      success: false,
      error: "Couldn't save, has the admin_delegates table been created in the database?",
    };
  }

  await sendOrderNoticeEmail({
    toEmail: email,
    subject: "You can now invite guests to the EcoFurnish admin",
    paragraphs: [
      "Hi,",
      `You've been made an access manager. You can invite people to look around the admin read-only, for up to ${maxDays} day(s) each, with up to ${maxActive} guests at a time.`,
      "Sign in with this email address, then open the account menu at the top right and choose \"Manage guests\", or use the button below. That's the only part of the admin you'll see.",
    ],
    cta: { label: "Open the Guests page", path: "/admin/guests" },
  });

  revalidatePath("/admin/guests");
  return { success: true };
}

/** Owner only: removes an access manager AND cuts off every guest they invited. */
export async function removeAccessManager(emailInput: string): Promise<Result> {
  await requireAdmin();
  const email = emailInput.trim().toLowerCase();
  const now = new Date();
  await db.update(adminDelegates).set({ revokedAt: now }).where(eq(adminDelegates.email, email));
  await db
    .update(adminGuests)
    .set({ revokedAt: now })
    .where(and(eq(adminGuests.grantedBy, email), isNull(adminGuests.revokedAt)));
  revalidatePath("/admin/guests");
  return { success: true };
}
