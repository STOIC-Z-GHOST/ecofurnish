import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";

/**
 * Shared guard for the Vercel cron routes. Returns a 401 response when the
 * request shouldn't run, or null when it's fine to proceed.
 *
 * In production the request must carry `Authorization: Bearer ${CRON_SECRET}`
 * (Vercel adds that header itself once CRON_SECRET is set as an environment
 * variable in the project). If CRON_SECRET isn't set, EVERY request is
 * refused — the old inline check compared against the literal string
 * "Bearer undefined" in that case, which anyone could send.
 *
 * Outside production the check is skipped so the routes can be opened in a
 * browser while developing, same as before.
 */
export function rejectUnlessCron(request: NextRequest): NextResponse | null {
  if (process.env.NODE_ENV !== "production") return null;

  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("CRON_SECRET is not set — refusing cron request");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const given = Buffer.from(request.headers.get("authorization") ?? "", "utf8");
  const expected = Buffer.from(`Bearer ${secret}`, "utf8");
  // Different lengths would make timingSafeEqual throw, and length alone
  // isn't secret, so it's fine to bail out on it.
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
