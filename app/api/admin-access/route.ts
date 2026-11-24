import { NextResponse } from "next/server";
import { getAdminAccess } from "@/lib/require-admin";

// Tells the account menu whether to show a "Guest admin" / "Manage guests"
// shortcut. It answers ONLY about the person asking (their own session cookie)
// and never takes an email or id from the request, so it can't be used to find
// out whether someone else has been invited.
//
// This is a convenience for the menu and nothing more: every admin page and
// server action still checks access for itself (lib/require-admin.ts), so
// hiding or showing a link here can never grant or remove anything. It is
// read fresh every time — never cached — so a revoke, or an expiry, takes the
// link away the next time the menu opens.
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "private, no-store, max-age=0", Vary: "Cookie" };

export async function GET() {
  try {
    const access = await getAdminAccess();
    // Real admins already get their own "Admin dashboard" item (from their
    // role), and everyone else — signed out, or just a customer — gets
    // exactly the same empty answer, so this reveals nothing about who has
    // a grant.
    if (!access || access.level === "admin") {
      return NextResponse.json({ access: null }, { headers: NO_STORE });
    }
    return NextResponse.json(
      { access: access.level === "guest" ? "guest" : "manager" },
      { headers: NO_STORE }
    );
  } catch (error) {
    console.error("Couldn't check admin access for the menu:", error);
    return NextResponse.json({ access: null }, { headers: NO_STORE });
  }
}
