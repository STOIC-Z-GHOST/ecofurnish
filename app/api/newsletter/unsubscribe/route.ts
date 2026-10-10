import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { newsletterSubscribers } from "@/db/schema";
import { escapeHtml } from "@/lib/escape-html";
import { isPlausibleEmail } from "@/lib/rate-limit";
import { isValidUnsubscribeToken } from "@/lib/unsubscribe-token";

// Handles both a normal link click (GET) and mail-client one-click
// unsubscribe (POST, per RFC 8058 / the List-Unsubscribe-Post header) —
// Gmail and Yahoo have required this for bulk senders since their 2024
// policy changes.
//
// The link must carry the signature that was generated for that exact
// address when the email was sent (see lib/unsubscribe-token.ts), so only
// someone holding a real unsubscribe link can use it — not anyone who just
// types ?email=other-person@example.com.
async function unsubscribe(email: string | null, token: string | null) {
  if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 });
  // Anything that isn't a plausible address is rejected before it can be
  // echoed back or reach the database.
  if (!isPlausibleEmail(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }
  if (!isValidUnsubscribeToken(email, token)) {
    return NextResponse.json({ error: "Invalid or expired link" }, { status: 400 });
  }
  await db.delete(newsletterSubscribers).where(eq(newsletterSubscribers.email, email));
  return { email };
}

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email");
  const result = await unsubscribe(email, request.nextUrl.searchParams.get("token"));
  if (result instanceof NextResponse) {
    // A person following a link deserves a readable page, not raw JSON.
    // Nothing from the request is echoed into it.
    return new NextResponse(
      `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:480px;margin:80px auto;text-align:center;">
        <h2>This link isn't valid</h2>
        <p style="color:#666;">The unsubscribe link is incomplete or out of date. Please use the link in your most recent EcoFurnish email, or <a href="/contact">contact us</a> and we'll remove you.</p>
      </body></html>`,
      { status: 400, headers: { "Content-Type": "text/html" } }
    );
  }

  return new NextResponse(
    `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:480px;margin:80px auto;text-align:center;">
      <h2>You're unsubscribed</h2>
      <p style="color:#666;">${escapeHtml(result.email)} won't receive further EcoFurnish newsletter emails.</p>
    </body></html>`,
    { headers: { "Content-Type": "text/html" } }
  );
}

export async function POST(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email");
  const result = await unsubscribe(email, request.nextUrl.searchParams.get("token"));
  if (result instanceof NextResponse) return result;
  return NextResponse.json({ success: true });
}
