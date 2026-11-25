"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/password-input";
import { PasswordStrengthMeter } from "@/components/password-strength-meter";
import { passesAllChecks } from "@/lib/password-strength";
import { authClient } from "@/lib/auth-client";

export default function ResetPasswordPage() {
  const router = useRouter();
  // Better Auth appends the token to redirectTo itself (see
  // authClient.requestPasswordReset's redirectTo in app/forgot-password) —
  // this page just reads it back off the URL.
  const token = useSearchParams().get("token");

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const passwordValid = passesAllChecks(password);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;

    if (!passwordValid) {
      setError("Please meet all the password requirements below.");
      return;
    }

    setLoading(true);
    setError(null);

    await authClient.resetPassword(
      { newPassword: password, token },
      {
        onSuccess: () => setDone(true),
        onError: (ctx) => setError(ctx.error.message || "Couldn't reset your password."),
        onResponse: () => setLoading(false),
      }
    );
  }

  if (!token) {
    return (
      <div className="container mx-auto flex max-w-sm flex-col justify-center px-4 py-24">
        <h1 className="text-2xl font-bold tracking-tight">Invalid reset link</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This link is missing its token, it may have been copied incorrectly. Request a new one
          instead.
        </p>
        <Link
          href="/forgot-password"
          className="mt-6 text-center text-sm font-medium text-foreground hover:underline"
        >
          Request a new link
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="container mx-auto flex max-w-sm flex-col justify-center px-4 py-24">
        <h1 className="text-2xl font-bold tracking-tight">Password reset</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your password has been updated. You can sign in with it now.
        </p>
        <Button onClick={() => router.push("/sign-in")} className="mt-6 w-full">
          Go to sign in
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto flex max-w-sm flex-col justify-center px-4 py-24">
      <h1 className="text-2xl font-bold tracking-tight">Choose a new password</h1>
      <p className="mt-1 text-sm text-muted-foreground">This link only works once.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="newPassword">New password</Label>
          <PasswordInput
            id="newPassword"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {password.length > 0 && <PasswordStrengthMeter password={password} />}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" className="w-full" disabled={loading || !passwordValid}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Reset password
        </Button>
      </form>
    </div>
  );
}
