// Turnstile's secret key has been set up under two different names in
// practice: TURNSTILE_SECRET_KEY (what the setup docs say) and
// CLOUDFLARE_TURNSTILE_SECRET_KEY. Reading only one of them meant that when
// the other was the one set — as it was on the live Vercel project — the app
// believed no key existed and quietly skipped the captcha check. Accept
// either, so a rename can never silently turn the check off again.
export function turnstileSecretKey(): string | undefined {
  return process.env.TURNSTILE_SECRET_KEY || process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY || undefined;
}
