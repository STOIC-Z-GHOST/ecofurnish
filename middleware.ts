import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { REFERRAL_COOKIE, REFERRAL_COOKIE_MAX_AGE_DAYS } from "@/lib/referral-cookie";

function isAdminPath(pathname: string) {
  // Normalise before comparing: Next.js decodes percent-escapes when it
  // routes a request, so "/%61dmin" reaches the /admin pages even though it
  // doesn't literally start with "/admin". Also collapse "//" and ignore
  // case, so the gate is deliberately a little broader than the real route
  // (anything it catches that isn't really /admin was a 404 anyway).
  let path = pathname;
  try {
    path = decodeURIComponent(path);
  } catch {
    // Malformed escape sequence — fall back to the raw path.
  }
  path = path.replace(/\/{2,}/g, "/").toLowerCase();
  return path === "/admin" || path.startsWith("/admin/");
}

// Better Auth's session cookie, under its default naming (lib/auth.ts doesn't
// override cookie names or the prefix): `better-auth.session_token`, with a
// `__Secure-` prefix added when the site is served over HTTPS. Checked by
// name here instead of importing Better Auth's own cookie helper, because
// that pulls its whole crypto/JWT stack into the middleware bundle — which
// runs on every request — just to read one cookie name.
// If you ever add `advanced.cookiePrefix` to lib/auth.ts, update this too.
const SESSION_COOKIE_NAMES = [
  "better-auth.session_token",
  "__Secure-better-auth.session_token",
];

function hasSessionCookie(request: NextRequest) {
  return SESSION_COOKIE_NAMES.some((name) => Boolean(request.cookies.get(name)?.value));
}

export function middleware(request: NextRequest) {
  // First line of defence for /admin: a visitor with no session cookie at
  // all gets a genuine 404 straight from here, before Next.js renders (or
  // sends) anything from the admin section. Rewriting to a path that doesn't
  // exist makes Next serve app/not-found.tsx inside the normal site layout,
  // with a real 404 status.
  //
  // This only checks that a session cookie EXISTS — it can't tell whether
  // the session is valid or belongs to an admin (that needs the database,
  // which isn't available here). That's deliberate: the real check, "is
  // this a signed-in admin", happens on the server in app/admin/layout.tsx,
  // in every admin page (requireAdminPage) and in every admin action. So a
  // forged cookie gets past this filter and then hits a 404 there instead.
  if (isAdminPath(request.nextUrl.pathname) && !hasSessionCookie(request)) {
    return NextResponse.rewrite(new URL("/404", request.url), { status: 404 });
  }

  const ref = request.nextUrl.searchParams.get("ref");
  if (!ref) return NextResponse.next();

  const response = NextResponse.next();
  // Don't clobber a code that's already been captured this visit — the
  // first referral link someone actually clicked is the one that should
  // get credit, not whatever ?ref= happens to be on a later page they land on.
  if (!request.cookies.get(REFERRAL_COOKIE)) {
    response.cookies.set(REFERRAL_COOKIE, ref, {
      maxAge: REFERRAL_COOKIE_MAX_AGE_DAYS * 24 * 60 * 60,
      path: "/",
      sameSite: "lax",
    });
  }
  return response;
}
