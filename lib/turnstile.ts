import { turnstileSecretKey } from "@/lib/turnstile-keys";

export async function verifyTurnstileToken(token: string): Promise<boolean> {
  const secret = turnstileSecretKey();
  if (!secret) {
    // In production a missing key must NOT mean "everyone passes" — that
    // would turn the captcha off without anyone noticing. Refuse instead.
    // (In local development, with no key configured, let it through.)
    if (process.env.NODE_ENV === "production") {
      console.error("No Turnstile secret key is set (TURNSTILE_SECRET_KEY or CLOUDFLARE_TURNSTILE_SECRET_KEY) — refusing the request.");
      return false;
    }
    console.warn("No Turnstile secret key is set — captcha check skipped (development only).");
    return true;
  }

  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: new URLSearchParams({
          secret,
          response: token,
        }),
      }
    );
    const data = await res.json();
    return data.success === true;
  } catch (err) {
    console.error("Turnstile verification failed:", err);
    return false;
  }
}
