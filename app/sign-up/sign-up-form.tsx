"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Mail, Lock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/password-input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { signUp, sendVerificationEmail } from "@/lib/auth-client";
import { PasswordStrengthMeter } from "@/components/password-strength-meter";
import { passesAllChecks } from "@/lib/password-strength";
import { TurnstileWidget } from "@/components/turnstile-widget";
import { SocialAuthButtons } from "@/components/social-auth-buttons";
import { AuthSidePanel } from "@/components/auth/AuthSidePanel";
import type { SocialProviderId } from "@/lib/social-providers";

export function SignUpForm({ socialProviders }: { socialProviders: SocialProviderId[] }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  // Bumped after every submit attempt to get a fresh captcha token — a token
  // can only be used once. See TurnstileWidget's resetSignal.
  const [captchaReset, setCaptchaReset] = useState(0);
  function resetCaptcha() {
    setCaptchaToken(null);
    setCaptchaReset((n) => n + 1);
  }
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [awaitingVerification, setAwaitingVerification] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent">("idle");

  const passwordValid = passesAllChecks(password);
  // Purely a client-side typo check — the confirm field is never sent
  // anywhere, it just catches "I fat-fingered my own password" before it
  // becomes a locked-out account and a support request.
  const passwordsMatch = confirmPassword.length === 0 || password === confirmPassword;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!passwordValid) {
      setError("Please meet all the password requirements below.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Those passwords don't match.");
      return;
    }

    // FormData must be read synchronously, before any `await` — by the time
    // an awaited promise resolves, the synthetic event's dispatch phase has
    // ended and `e.currentTarget` can no longer be relied on.
    const formData = new FormData(e.currentTarget);

    setLoading(true);

    // The token is sent with the sign-up request itself and checked by the
    // server (see the captcha plugin in lib/auth.ts) — not in a separate step.
    if (!captchaToken) {
      setError("Please complete the captcha.");
      setLoading(false);
      return;
    }

    const name = String(formData.get("name") || "");
    const email = String(formData.get("email") || "");

    await signUp.email(
      { name, email, password },
      {
        headers: { "x-captcha-response": captchaToken },
        onSuccess: () => {
          setSubmittedEmail(email);
          setAwaitingVerification(true);
          setLoading(false);
        },
        onError: (ctx) => {
          setError(ctx.error.message || "Couldn't create your account.");
          setLoading(false);
          resetCaptcha();
        },
      }
    );
  }

  async function handleResend() {
    setResendState("sending");
    await sendVerificationEmail(
      { email: submittedEmail, callbackURL: "/" },
      {
        onSuccess: () => setResendState("sent"),
        onError: () => setResendState("idle"),
      }
    );
  }

  return (
    <div className="bg-emerald-50 dark:bg-transparent">
      <div className="container mx-auto grid max-w-6xl gap-12 px-4 py-4 lg:max-w-7xl lg:grid-cols-2 lg:items-start lg:gap-16 lg:py-4">
        <AuthSidePanel
          heading={
            <>
              Create your
              <br />
              account
            </>
          }
          subheading={
            <>
              Join EcoFurnish and be part of a{" "}
              <span className="font-medium text-primary">sustainable</span> future.
            </>
          }
        />

        <div className="mx-auto w-full max-w-sm rounded-2xl border border-border/60 bg-card p-8 shadow-xl lg:mx-0 lg:max-w-xl lg:p-8">
          {awaitingVerification ? (
            <div className="text-center">
              <h2 className="text-2xl font-bold tracking-tight lg:text-3xl">Check your email</h2>
              <p className="mt-3 text-sm text-muted-foreground">
                We sent a verification link to your inbox. Click it to activate your account,
                then come back and sign in.
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Don&apos;t see it? Check your spam or junk folder — and if it&apos;s there, mark it
                &quot;Not spam&quot; so it (and future emails) land in your inbox.{" "}
                <Link href="/help/check-spam" className="font-medium text-foreground hover:underline">
                  More help
                </Link>
              </p>
              <Button className="mt-6 w-full lg:h-11" render={<Link href="/sign-in" />} nativeButton={false}>
                Go to sign in
              </Button>
              <button
                type="button"
                onClick={handleResend}
                disabled={resendState !== "idle"}
                className="mt-4 text-sm font-medium text-foreground hover:underline disabled:no-underline disabled:text-muted-foreground"
              >
                {resendState === "sent"
                  ? "Sent — check your inbox"
                  : resendState === "sending"
                    ? "Sending…"
                    : "Link expired or never arrived? Send a new one"}
              </button>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h2 className="text-2xl font-bold tracking-tight lg:text-3xl">Create an account</h2>
                <p className="text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link href="/sign-in" className="font-medium text-primary hover:underline">
                    Sign in
                  </Link>
                </p>
              </div>

              <form onSubmit={handleSubmit} className="mt-4 space-y-3">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Full name</Label>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="name"
                        name="name"
                        required
                        autoComplete="name"
                        placeholder="Full name"
                        className="pl-9 lg:h-11"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        autoComplete="email"
                        placeholder="Email address"
                        className="pl-9 lg:h-11"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <PasswordInput
                      id="password"
                      name="password"
                      required
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      className="pl-9 lg:h-11"
                    />
                  </div>
                  {password.length > 0 ? (
                    <PasswordStrengthMeter password={password} />
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Use 8 or more characters with a mix of letters, numbers &amp; symbols.
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirm-password">Confirm password</Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <PasswordInput
                      id="confirm-password"
                      required
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm password"
                      className="pl-9 lg:h-11"
                    />
                  </div>
                  {!passwordsMatch && (
                    <p className="text-xs text-destructive">Passwords don&apos;t match.</p>
                  )}
                </div>

                <label className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Checkbox
                    checked={agreedToTerms}
                    onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                    className="mt-0.5"
                  />
                  <span>
                    I agree to the{" "}
                    <Link
                      href="/terms"
                      target="_blank"
                      className="font-medium text-foreground hover:underline"
                    >
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link
                      href="/privacy"
                      target="_blank"
                      className="font-medium text-foreground hover:underline"
                    >
                      Privacy Policy
                    </Link>
                  </span>
                </label>

                <TurnstileWidget onVerify={setCaptchaToken} onExpire={() => setCaptchaToken(null)} resetSignal={captchaReset} />

                {error && <p className="text-sm text-destructive">{error}</p>}

                <Button
                  type="submit"
                  className="w-full lg:h-11"
                  disabled={loading || !passwordValid || !passwordsMatch || !agreedToTerms}
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Create account
                </Button>
              </form>

              <div className="mt-3">
                <SocialAuthButtons providers={socialProviders} disabled={!agreedToTerms} />
              </div>

              <p className="mt-4 text-center text-xs text-muted-foreground">
                By creating an account, you&apos;ll join the EcoFurnish community and start your{" "}
                <span className="font-medium text-primary">sustainable</span> journey.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
