import { betterAuth } from "better-auth";
import { captcha } from "better-auth/plugins";
import { turnstileSecretKey } from "@/lib/turnstile-keys";
import { Pool } from "pg";
import {
  sendVerificationEmail,
  sendWelcomeEmail,
  sendDeleteAccountEmail,
  sendResetPasswordEmail,
  sendPasswordChangedEmail,
  sendExistingAccountSignUpAttemptEmail,
} from "./email";
import { attributeReferral } from "./referrals";

// Set up the database connection pool using your environment variable
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Server-side captcha for the forms that hit Better Auth. The browser sends
// the Turnstile token in an `x-captcha-response` header and Better Auth
// verifies it with Cloudflare BEFORE the sign-up / sign-in / password-reset
// endpoint runs — so skipping the form and calling /api/auth/* directly no
// longer bypasses the captcha. (Previously the form checked the captcha in
// a separate step that these endpoints knew nothing about.)
//
// On when the secret key is set, and also whenever this is a production
// build: a production deploy with no Turnstile secret key set then
// refuses these requests instead of silently skipping the check. Local
// development without a key still works with no captcha.
const turnstileEnforced =
  Boolean(turnstileSecretKey()) || process.env.NODE_ENV === "production";

export const auth = betterAuth({
  // FIX: Pass the pool directly instead of wrapping it in an object
  database: pool, 
  
  // Without this, an error partway through an email-link flow (delete
  // account, email verification, password reset) shows the visitor raw
  // JSON like {"message":"Failed to get user info", ...} instead of an
  // actual page. The most common real trigger: delete-account and
  // password-reset links require an active session for the account being
  // acted on (a deliberate Better Auth security check, not a bug) — if
  // the link opens in a different browser/app than the one they're
  // signed into (very easy to do from a phone's mail app), this is
  // exactly the error that results.
  onAPIError: {
    errorURL: "/auth/error",
  },
  
  // This tells Better Auth about your custom admin column
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "user",
        // SECURITY: without `input: false`, Better Auth lets a client set
        // this field itself — anyone could POST /api/auth/sign-up/email
        // with `role: "admin"` (or call update-user later) and become an
        // admin. Roles are only ever assigned server-side: `pnpm
        // make-admin` and the dispatcher actions in app/admin/actions.ts
        // both write straight to the DB, so nothing legitimate needs this.
        input: false,
      },
      preferredCurrency: {
        type: "string",
        defaultValue: "ETB",
      },
    },
    // Sends a "confirm deletion" email before an account is actually
    // removed, rather than deleting immediately on request.
    deleteUser: {
      enabled: true,
      sendDeleteAccountVerification: async ({ user, url }) => {
        await sendDeleteAccountEmail(user.email, url);
      },
    },
  },
  // "Continue with ___" buttons. Each provider only turns on once its two
  // env vars are actually set, so half-configured providers don't show a
  // button that just errors when clicked.
  // Without this, Better Auth refuses to connect a social sign-in to an
  // existing same-email account — it throws account_not_linked instead,
  // as a deliberate safety default rather than silently merging accounts.
  // "microsoft" is deliberately left out of trustedProviders: unlike
  // Google/GitHub, Entra doesn't reliably assert the email as
  // verified (it can come from a tenant-mutable field), so trusting it
  // for linking would mean trusting an unverified claim of "this is my
  // email" — worth the extra friction for that one provider specifically.
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google", "github"],
    },
  },
  socialProviders: {
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          },
        }
      : {}),
    ...(process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET
      ? {
          microsoft: {
            clientId: process.env.MICROSOFT_CLIENT_ID,
            clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
            // "common" accepts both personal Microsoft accounts and work/
            // school accounts from any organization — the right default
            // for a public storefront. Narrow it to your own tenant ID
            // only if you want to restrict sign-in to one organization.
            tenantId: process.env.MICROSOFT_TENANT_ID || "common",
          },
        }
      : {}),
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ? {
          github: {
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
          },
        }
      : {}),
    // Discord's account-verification reliability isn't confirmed the way
    // Google/GitHub's is (see trustedProviders below) — this is
    // sign-in only, no "guilds" or other Discord-data scopes requested.
    ...(process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET
      ? {
          discord: {
            clientId: process.env.DISCORD_CLIENT_ID,
            clientSecret: process.env.DISCORD_CLIENT_SECRET,
          },
        }
      : {}),
  },
  emailAndPassword: {
    enabled: true,
    // Blocks sign-in until the email link below is clicked.
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await sendResetPasswordEmail(user.email, url);
    },
    // Fires server-side right after a successful token-based reset — no
    // session to read yet at that point (this device may not be signed
    // in), so this reuses the same "password changed" notice the account
    // settings page sends after an authenticated change, just triggered
    // from the token flow instead of a session lookup.
    onPasswordReset: async ({ user }) => {
      await sendPasswordChangedEmail(user.email, user.name ?? "there");
    },
    // Fires when someone submits the sign-up form with an email that's
    // already registered. Better Auth deliberately returns a fake
    // "success" response in this case (with requireEmailVerification on,
    // as above) rather than a "user already exists" error — this stops an
    // attacker from probing emails to see which ones already have
    // accounts, since the requester's response looks identical either
    // way. No new account is created and no email goes to whoever made
    // the attempt.
    //
    // That silence is a problem for a genuine account owner who forgot
    // they'd already signed up, though — they'd get no email and no clue
    // to just sign in instead. This only notifies them if the existing
    // account is actually verified; an unverified existing account is
    // more likely the same person re-attempting their own signup, so
    // there's nothing suspicious to flag.
    onExistingUserSignUp: async ({ user }) => {
      if (user.emailVerified) {
        await sendExistingAccountSignUpAttemptEmail(user.email, user.name ?? "there");
      }
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationEmail(user.email, url);
    },
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    // Fires exactly once, right when the email link is actually clicked —
    // this used to fire from the sign-up form's onSuccess instead, which
    // only means the sign-up *request* succeeded, not that the account is
    // actually usable yet (sign-in stays blocked until this point, per
    // requireEmailVerification above). That mismatch was also why a
    // repeat attempt with an already-registered, still-unverified email
    // could resend a "your account is ready" email without ever sending a
    // fresh verification link — this callback only ever fires on genuine
    // verification, so that can't happen anymore.
    afterEmailVerification: async (user) => {
      await sendWelcomeEmail(user.email, user.name ?? "there");
      // Attribution happens here, not at raw signup — this only fires once
      // the account is genuinely real (sign-in stays blocked until this
      // point), so an abandoned/never-verified signup can't earn anyone a
      // referral credit.
      await attributeReferral(user.id);
    },
  },
  // Email/password signups get the welcome email + referral credit from
  // afterEmailVerification above, once they click the link. Social
  // sign-ups never go through that step — the provider already vouches
  // for the email — so this is the equivalent trigger for them. Gated on
  // emailVerified so it can't double-fire: an email/password signup also
  // creates a user row here (before verification, with emailVerified
  // false), and skipping it keeps that path solely owned by
  // afterEmailVerification like it already was.
  //
  // Wrapped in try/catch deliberately: Better Auth has open issues of
  // this exact hook being unreliable for social sign-in specifically (the
  // user row not always being found inside it). A failure here should
  // cost a missed welcome email/referral credit, not break someone's
  // actual sign-in.
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          try {
            if (!user.emailVerified) return;
            await sendWelcomeEmail(user.email, user.name ?? "there");
            await attributeReferral(user.id);
          } catch (err) {
            console.error("Post-signup hook failed for", user.email, err);
          }
        },
      },
    },
  },
  plugins: turnstileEnforced
    ? [
        captcha({
          provider: "cloudflare-turnstile",
          secretKey: turnstileSecretKey() ?? "",
          endpoints: ["/sign-up/email", "/sign-in/email", "/request-password-reset"],
        }),
      ]
    : [],
  // Better Auth rate-limits auth routes by default in production, but its
  // default storage is in-memory — on a serverless host (Vercel) each
  // invocation can be a fresh instance, so that in-memory counter doesn't
  // reliably persist between requests and the protection is much weaker
  // than it looks. Pointing it at the database instead makes it durable.
  // Run `pnpm auth:migrate` once after this change to create the
  // `rateLimit` table.
  rateLimit: {
    storage: "database",
    customRules: {
      // Brute-force login attempts and signup spam are the routes worth
      // limiting tighter than the global default.
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 60, max: 5 },
      // Same reasoning — without this, someone could spam reset emails at
      // an arbitrary inbox, or brute-force guess reset tokens.
      "/forget-password": { window: 60, max: 5 },
      "/reset-password": { window: 60, max: 5 },
    },
  },
});
