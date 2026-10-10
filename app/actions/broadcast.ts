"use server";

import { and, eq, isNull, isNotNull, sql } from "drizzle-orm";
import { Resend } from "resend";
import { db } from "@/db";
import { newsletterSubscribers, driverApplications } from "@/db/schema";
import { requireAdmin } from "@/lib/require-admin";
import { unsubscribePath } from "@/lib/unsubscribe-token";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM_ADDRESS = "EcoFurnish <admin@ecofurnish.abrdns.com>";

export type BroadcastAudience =
  | "all-customers"
  | "subscribers"
  | "drivers"
  | "single-customer"
  | "custom-address";

// Better Auth manages the "user" table itself (via its own raw `pg` Pool
// in lib/auth.ts, outside db/schema.ts), so there's no Drizzle table
// object to import here — this queries it directly by name instead.
// Written against Better Auth's default column naming (camelCase,
// unquoted-lowercase table name); if lib/auth.ts's `user` config ever
// adds a `fields`/`modelName` remap, this needs to match it.
async function getAllCustomerEmails(): Promise<{ email: string; name: string }[]> {
  const result = await db.execute<{ email: string; name: string }>(
    sql`SELECT email, name FROM "user" WHERE email IS NOT NULL`
  );
  return result.rows;
}

// Approved, non-blacklisted drivers who have an email on file — email is
// optional for drivers (phone is the required contact, see
// driverApplications.email in db/schema.ts), so this is necessarily a
// subset of all active drivers, not every one of them. See
// getBroadcastAudienceCounts below, which surfaces that gap in the UI
// rather than silently under-delivering.
async function getApprovedDriverEmails(): Promise<{ email: string; name: string }[]> {
  const rows = await db
    .select({ email: driverApplications.email, name: driverApplications.fullName })
    .from(driverApplications)
    .where(
      and(
        eq(driverApplications.status, "approved"),
        isNull(driverApplications.blacklistedAt),
        isNotNull(driverApplications.email)
      )
    );
  // isNotNull guarantees email is populated at the DB level, but
  // Drizzle's inferred row type still carries `string | null` here —
  // this narrows it back to plain `string` for callers.
  return rows.map((r) => ({ email: r.email as string, name: r.name }));
}

// Exposed for the "message one specific customer" picker in
// BroadcastForm — same query as above, just under a name that makes
// sense as a public export (getAllCustomerEmails predates that use case
// and returning counts-only felt like the more private-sounding name to
// keep internal).
export async function getAllCustomers() {
  await requireAdmin();
  return getAllCustomerEmails();
}

export async function getBroadcastAudienceCounts() {
  await requireAdmin();
  const [customers, subscribers, driversWithEmail, approvedDrivers] = await Promise.all([
    getAllCustomerEmails(),
    db.select({ email: newsletterSubscribers.email }).from(newsletterSubscribers),
    getApprovedDriverEmails(),
    db
      .select({ id: driverApplications.id })
      .from(driverApplications)
      .where(
        and(eq(driverApplications.status, "approved"), isNull(driverApplications.blacklistedAt))
      ),
  ]);
  return {
    allCustomers: customers.length,
    subscribers: subscribers.length,
    driversWithEmail: driversWithEmail.length,
    driversTotal: approvedDrivers.length,
  };
}

function wrapHtml(bodyHtml: string, unsubscribeUrl?: string) {
  return `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
      <div style="color:#3a3f38;white-space:pre-wrap;">${bodyHtml}</div>
      ${
        unsubscribeUrl
          ? `<p style="color:#9a9890;font-size:12px;margin-top:32px;border-top:1px solid #e0ddd0;padding-top:16px;">
               <a href="${unsubscribeUrl}" style="color:#9a9890;">Unsubscribe</a>
             </p>`
          : ""
      }
    </div>
  `;
}

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

/**
 * `all-customers` is meant for genuinely important, infrequent notices
 * (a policy change, a security notice) — treated like the existing order
 * emails, no unsubscribe link, because there's no reasonable way to "opt
 * out" of account-related notices short of deleting the account. It is
 * NOT the list for regular updates/promotions — that's what the opt-in
 * `subscribers` audience and its existing unsubscribe machinery are for.
 * `drivers` follows the same no-unsubscribe reasoning as all-customers —
 * an operational notice to active drivers, not a marketing list — and
 * only reaches approved, non-blacklisted drivers who have an email on
 * file, which won't be all of them (email is optional for drivers; see
 * getApprovedDriverEmails above). Sending routine marketing to every
 * account holder is what gets a sending domain flagged as spam, which
 * would also degrade delivery of the verification/reset-password emails
 * sharing that same domain.
 */
export async function sendBroadcastEmail({
  subject,
  body,
  audience,
  recipientEmail,
}: {
  subject: string;
  body: string;
  audience: BroadcastAudience | "test";
  // Required when audience is "single-customer" — ignored otherwise.
  recipientEmail?: string;
}) {
  const session = await requireAdmin();

  if (!resend) {
    return { success: false as const, error: "RESEND_API_KEY is not set." };
  }
  if (!subject.trim() || !body.trim()) {
    return { success: false as const, error: "Subject and message can't be empty." };
  }

  let recipients: { email: string }[];
  let unsubscribable = false;

  if (audience === "test") {
    recipients = [{ email: session.user.email }];
  } else if (audience === "subscribers") {
    recipients = await db.select({ email: newsletterSubscribers.email }).from(newsletterSubscribers);
    unsubscribable = true;
  } else if (audience === "drivers") {
    recipients = await getApprovedDriverEmails();
  } else if (audience === "single-customer") {
    if (!recipientEmail) {
      return { success: false as const, error: "No customer selected." };
    }
    recipients = [{ email: recipientEmail }];
  } else if (audience === "custom-address") {
    // No user-table lookup for this one — could be anyone. Just a sanity
    // check against an obvious typo, not real RFC 5322 validation.
    if (!recipientEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
      return { success: false as const, error: "Enter a valid email address." };
    }
    recipients = [{ email: recipientEmail }];
  } else {
    recipients = await getAllCustomerEmails();
  }

  if (recipients.length === 0) {
    return { success: false as const, error: "No recipients in that audience yet." };
  }

  const bodyHtml = body.replace(/\n/g, "<br />");

  // Resend's batch endpoint caps at 100 emails per call — chunk larger
  // lists rather than sending one email with everyone in `to` (which
  // would expose every recipient's address to every other recipient).
  const CHUNK_SIZE = 100;
  let sent = 0;
  let failed = 0;

  for (let i = 0; i < recipients.length; i += CHUNK_SIZE) {
    const chunk = recipients.slice(i, i + CHUNK_SIZE);
    try {
      const { error } = await resend.batch.send(
        chunk.map(({ email }) => {
          const unsubscribeUrl = unsubscribable
            ? `${appUrl()}${unsubscribePath(email)}`
            : undefined;
          return {
            from: FROM_ADDRESS,
            to: email,
            subject,
            text: body + (unsubscribeUrl ? `\n\nUnsubscribe: ${unsubscribeUrl}` : ""),
            html: wrapHtml(bodyHtml, unsubscribeUrl),
            ...(unsubscribeUrl
              ? {
                  headers: {
                    "List-Unsubscribe": `<${unsubscribeUrl}>`,
                    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
                  },
                }
              : {}),
          };
        })
      );
      if (error) {
        failed += chunk.length;
        console.error("Broadcast batch failed:", error);
      } else {
        sent += chunk.length;
      }
    } catch (err) {
      failed += chunk.length;
      console.error("Broadcast batch threw:", err);
    }
  }

  return { success: failed === 0, sent, failed };
}
