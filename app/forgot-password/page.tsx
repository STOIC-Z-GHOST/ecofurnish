"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { TurnstileWidget } from "@/components/turnstile-widget";

export default function ForgotPasswordPage() {
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
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Read FormData synchronously, before any `await` below — see sign-in
    // page for why e.currentTarget can't be relied on after that.
    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") || "");

    setLoading(true);
    setError(null);

    // The token is sent with the request itself and checked by the server
    // (see the captcha plugin in lib/auth.ts) — not in a separate step.
    if (!captchaToken) {
      setError("Please complete the captcha.");
      setLoading(false);
      return;
    }

    await authClient.requestPasswordReset(
      { email, redirectTo: "/reset-password" },
      {
        headers: { "x-captcha-response": captchaToken },
        // Better Auth responds the same way whether or not the email is
        // registered, so this doesn't need to fudge the outcome itself —
        // just don't hide a genuine failure (e.g. rate limited) behind a
        // fake "check your email" state.
        onSuccess: () => setSent(true),
        onError: (ctx) => setError(ctx.error.message || "Something went wrong — try again."),
        onResponse: () => {
          setLoading(false);
          resetCaptcha();
        },
      }
    );
  }

  return (
    <div className="container mx-auto flex max-w-sm flex-col justify-center px-4 py-24">
      <h1 className="text-2xl font-bold tracking-tight">Reset your password</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        We&apos;ll email you a link to choose a new one.
      </p>

      {sent ? (
        <div className="mt-6 space-y-4 rounded-lg border border-border/60 p-4 text-sm">
          <p className="text-muted-foreground">
            If an account exists for that email, a reset link is on its way — check your inbox.
          </p>
          <Link
            href="/sign-in"
            className="block text-center text-sm font-medium text-foreground hover:underline"
          >
            Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required autoComplete="email" />
          </div>

          <TurnstileWidget onVerify={setCaptchaToken} onExpire={() => setCaptchaToken(null)} resetSignal={captchaReset} />

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Send reset link
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Remembered it after all?{" "}
        <Link href="/sign-in" className="font-medium text-foreground hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
