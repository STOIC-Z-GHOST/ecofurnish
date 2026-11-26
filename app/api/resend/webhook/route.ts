import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { db } from "@/db";
import { inboundEmails } from "@/db/schema";

// Resend POSTs here for every email sent to the receiving domain
// (support@, hello@, etc. @ecofurnish.abrdns.com — configured as the MX
// record target in Resend's dashboard, separate from ecofurnish.de5.net
// which is only the deployed site's own domain).
//
// The webhook body carries metadata only (from/to/subject) — the actual
// message content needs a follow-up call to Resend's Receiving API,
// which is what most of this route is doing. Signature verification uses
// Resend's Svix-based scheme; the secret comes from Resend's dashboard
// under Webhooks (a different value from RESEND_API_KEY) and must be set
// as RESEND_WEBHOOK_SECRET.
//
// Deliberately not hand-typing the verify() result here — it returns a
// union covering every webhook event Resend sends (contacts, bounces,
// etc.), not just email.received, so it's left to infer and narrowed
// below via the `type` check instead of declared up front.

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  if (!resend || !process.env.RESEND_WEBHOOK_SECRET) {
    console.warn("RESEND_API_KEY or RESEND_WEBHOOK_SECRET not set, inbound email dropped.");
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  let event;
  try {
    event = resend.webhooks.verify({
      payload: rawBody,
      headers: {
        id: request.headers.get("svix-id") ?? "",
        timestamp: request.headers.get("svix-timestamp") ?? "",
        signature: request.headers.get("svix-signature") ?? "",
      },
      webhookSecret: process.env.RESEND_WEBHOOK_SECRET,
    });
  } catch (err) {
    console.error("Resend webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  if (event.type !== "email.received") {
    // Resend uses this same endpoint URL for outbound delivery events too
    // if you subscribe to them — safe to just ignore anything that isn't
    // an inbound email.
    return NextResponse.json({ received: true });
  }

  // TypeScript narrows event.data to the email.received shape from here
  // on, based on the type check above.
  const { email_id, from, to, subject } = event.data;

  try {
    const full = await resend.emails.receiving.get(email_id);

    await db
      .insert(inboundEmails)
      .values({
        resendEmailId: email_id,
        fromEmail: from,
        toEmail: to?.[0] ?? "",
        subject: subject ?? "(no subject)",
        text: full.data?.text ?? null,
        html: full.data?.html ?? null,
      })
      .onConflictDoNothing();
  } catch (err) {
    // Resend keeps the email (and retries the webhook) even if this
    // fails, so a transient DB error here doesn't lose the message —
    // worst case it arrives again on retry and onConflictDoNothing
    // handles the duplicate.
    console.error("Failed to store inbound email:", err);
    return NextResponse.json({ error: "Storage failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
