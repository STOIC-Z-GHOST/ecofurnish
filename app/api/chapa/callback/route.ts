import { createHmac, timingSafeEqual } from "crypto";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { confirmPayment } from "@/app/actions/orders";

// Chapa POSTs here once a payment completes — this is the reliable path
// (unlike the browser return_url redirect, which the customer can close
// out of before it fires; see the order-confirmation page, which also
// calls confirmPayment as a fallback for that case).
//
// Every request is verified against Chapa's HMAC-SHA256 webhook signature
// before anything in the body is trusted. Chapa signs the raw request body
// with the *webhook secret* you set in Dashboard → Settings → Webhooks —
// note this is a separate value from CHAPA_SECRET_KEY (your API key), and
// must be added to .env as CHAPA_WEBHOOK_SECRET.
//
// Field names below (`x-chapa-signature`, `chapa-signature`, `tx_ref`)
// follow Chapa's public webhook docs as of when this was written —
// confirm them against a real payload from your Chapa dashboard's webhook
// log before relying on this in production, in case their schema changes.
function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.CHAPA_WEBHOOK_SECRET;
  if (!secret) {
    console.error("CHAPA_WEBHOOK_SECRET is not set, refusing all webhook calls");
    return false;
  }

  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const expectedBuf = Buffer.from(expected, "utf8");
  const givenBuf = Buffer.from(signature, "utf8");

  // Different-length buffers would throw in timingSafeEqual, and the
  // length itself isn't secret, so it's fine to short-circuit on it.
  if (expectedBuf.length !== givenBuf.length) return false;
  return timingSafeEqual(expectedBuf, givenBuf);
}

export async function POST(request: NextRequest) {
  // Read as raw text first — verification must run against the exact
  // bytes Chapa signed, before any JSON parsing normalizes whitespace.
  const rawBody = await request.text();
  const signature =
    request.headers.get("x-chapa-signature") ?? request.headers.get("chapa-signature");

  if (!signature || !verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const txRef = payload.tx_ref ?? payload.trx_ref;
  if (typeof txRef !== "string" || !txRef) {
    return NextResponse.json({ error: "Missing tx_ref" }, { status: 400 });
  }

  // Look up by chapaTxRef rather than parsing orderId out of the tx_ref
  // string — txRef is `EF-{orderId.slice(0,8)}-{timestamp}` (see
  // app/actions/orders.ts), and doesn't even contain the full orderId to
  // parse back out.
  const [order] = await db.select().from(orders).where(eq(orders.chapaTxRef, txRef)).limit(1);
  if (!order) {
    return NextResponse.json({ error: "Unknown transaction" }, { status: 404 });
  }

  // confirmPayment re-verifies server-to-server with Chapa's API before
  // touching stock or sending email, and is a no-op if already paid — the
  // signature check above stops forged calls from reaching it at all,
  // these checks stop it from double-processing a legitimate one.
  await confirmPayment(order.id, txRef);
  return NextResponse.json({ received: true });
}
