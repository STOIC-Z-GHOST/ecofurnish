"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/password-input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { signIn, authClient } from "@/lib/auth-client";
import { TurnstileWidget } from "@/components/turnstile-widget";
import { SocialAuthButtons } from "@/components/social-auth-buttons";
import { AuthSidePanel } from "@/components/auth/AuthSidePanel";
import type { SocialProviderId } from "@/lib/social-providers";
import { toast } from "sonner";

export function SignInForm({ socialProviders }: { socialProviders: SocialProviderId[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  // Bumped after every submit attempt to get a fresh captcha token — a token
  // can only be used once. See TurnstileWidget's resetSignal.
  const [captchaReset, setCaptchaReset] = useState(0);
  function resetCaptcha() {
    setCaptchaToken(null);
    setCaptchaReset((n) => n + 1);
  }
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Must read FormData synchronously, before any `await` below —
    // e.currentTarget isn't reliably valid once an awaited promise resolves.
    const formData = new FormData(e.currentTarget);

    setLoading(true);
    setError(null);
    setUnverifiedEmail(null);

    // The token is sent with the sign-in request itself and checked by the
    // server (see the captcha plugin in lib/auth.ts) — not in a separate step.
    if (!captchaToken) {
      setError("Please complete the captcha.");
      setLoading(false);
      return;
    }

    const email = String(formData.get("email") || "");

    await signIn.email(
      { email, password: String(formData.get("password") || ""), rememberMe },
      {
        headers: { "x-captcha-response": captchaToken },
        onSuccess: () => router.push("/"),
        onError: (ctx) => {
          resetCaptcha();
          const message = ctx.error.message || "Couldn't sign in with those details.";
          // better-auth blocks sign-in for unverified accounts (requireEmailVerification
          // is on) — detect that case so we can offer to resend the link instead of
          // just showing a generic error.
          if (/verify|verification/i.test(message)) {
            setUnverifiedEmail(email);
          } else {
            setError(message);
          }
          setLoading(false);
        },
      }
    );
  }

  async function handleResend() {
    if (!unverifiedEmail) return;
    setResending(true);
    await authClient.sendVerificationEmail(
      { email: unverifiedEmail },
      {
        onSuccess: () => {
          toast.success("Verification email sent — check your inbox.");
        },
        onError: (ctx) => {
          toast.error(ctx.error.message || "Couldn't resend the email.");
        },
        onResponse: () => setResending(false),
      }
    );
  }

  return (
    <div className="bg-emerald-50 dark:bg-transparent">
      <div className="container mx-auto grid max-w-6xl gap-12 px-4 py-4 lg:max-w-7xl lg:grid-cols-2 lg:items-start lg:gap-16 lg:py-4">
        {/* Decorative side — hidden below lg, this is styling only, none
            of the actual sign-in logic lives here. */}
        <AuthSidePanel
          heading={
            <>
              Welcome
              <br />
              back!
            </>
          }
          subheading={
            <>
              Sign in to continue your <span className="font-medium text-primary">sustainable</span>{" "}
              journey.
            </>
          }
        />

        {/* The actual sign-in card — same form/logic as before, just
            restyled to sit inside a card with icon-led inputs. */}
        <div className="mx-auto w-full max-w-sm rounded-2xl border border-border/60 bg-card p-8 shadow-xl lg:mx-0 lg:max-w-xl lg:p-8">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 className="text-2xl font-bold tracking-tight lg:text-3xl">Sign in</h2>
            <p className="text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/sign-up" className="font-medium text-primary hover:underline">
                Sign up
              </Link>
            </p>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Welcome back to <span className="font-medium text-primary">EcoFurnish</span>.
          </p>

          {unverifiedEmail ? (
            <div className="mt-6 space-y-4 rounded-lg border border-border/60 p-4 text-sm">
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">{unverifiedEmail}</span> hasn&apos;t
                been verified yet. Check your inbox for the link, or send a new one.
              </p>
              <Button onClick={handleResend} disabled={resending} className="w-full" size="sm">
                {resending && <Loader2 className="h-4 w-4 animate-spin" />}
                Resend verification email
              </Button>
              <button
                type="button"
                onClick={() => setUnverifiedEmail(null)}
                className="w-full text-center text-xs text-muted-foreground hover:underline"
              >
                Back to sign in
              </button>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="mt-4 space-y-3">
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
                      placeholder="Enter your email"
                      className="pl-9 lg:h-11"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link
                      href="/forgot-password"
                      className="text-xs font-medium text-muted-foreground hover:text-foreground hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <PasswordInput
                      id="password"
                      name="password"
                      required
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      className="pl-9 lg:h-11"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Checkbox checked={rememberMe} onCheckedChange={setRememberMe} />
                  Remember me
                </label>

                <TurnstileWidget onVerify={setCaptchaToken} onExpire={() => setCaptchaToken(null)} resetSignal={captchaReset} />

                {error && <p className="text-sm text-destructive">{error}</p>}

                <Button type="submit" className="w-full lg:h-11" disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Sign in
                </Button>
              </form>

              <div className="mt-3">
                <SocialAuthButtons providers={socialProviders} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
