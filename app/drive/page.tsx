"use client";

import { useState } from "react";
import { Loader2, Bike, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TurnstileWidget } from "@/components/turnstile-widget";
import { submitDriverApplication } from "@/app/actions/driver-application";
import { VEHICLE_TYPES } from "@/lib/vehicle-types";

const EMPTY_FORM = {
  fullName: "",
  phone: "",
  email: "",
  city: "",
  vehicleType: "",
  notes: "",
};

export default function DriveApplicationPage() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  // Bumped after every submit attempt to get a fresh captcha token — a token
  // can only be used once. See TurnstileWidget's resetSignal.
  const [captchaReset, setCaptchaReset] = useState(0);
  function resetCaptcha() {
    setCaptchaToken(null);
    setCaptchaReset((n) => n + 1);
  }
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  function update<K extends keyof typeof EMPTY_FORM>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!form.vehicleType) {
      setError("Please select how you'd be getting around.");
      return;
    }

    if (!captchaToken) {
      setError("Please complete the captcha.");
      return;
    }

    setSubmitting(true);

    // The token goes to the server action itself, which verifies it with
    // Cloudflare before doing anything — not in a separate earlier step.
    const result = await submitDriverApplication({ ...form, captchaToken });
    setSubmitting(false);
    resetCaptcha(); // a token is single-use, so get a fresh one for any retry

    if (result.success) {
      setSent(true);
    } else {
      setError(result.error);
    }
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-16">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight">Drive for EcoFurnish</h1>
        <p className="mt-3 text-muted-foreground">
          Deliver sustainable furniture around Addis Ababa. Apply below — no account needed, and
          a dispatcher will follow up by phone or email once they&apos;ve reviewed it.
        </p>
      </div>

      <div className="rounded-lg border border-border/60 p-6">
        {sent ? (
          <div className="py-8 text-center">
            <h2 className="text-xl font-semibold">Application received</h2>
            <p className="mt-2 text-muted-foreground">
              Thanks for applying — a dispatcher will review it and get back to you soon.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  required
                  autoComplete="name"
                  value={form.fullName}
                  onChange={(e) => update("fullName", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone number</Label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    required
                    autoComplete="tel"
                    className="pl-9"
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email (optional)</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="city">City</Label>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="city"
                    required
                    autoComplete="address-level2"
                    placeholder="e.g. Addis Ababa"
                    className="pl-9"
                    value={form.city}
                    onChange={(e) => update("city", e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="vehicleType">How will you get around?</Label>
              <Select value={form.vehicleType} onValueChange={(v) => v && update("vehicleType", v)}>
                <SelectTrigger id="vehicleType" className="w-full">
                  <Bike className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Select one" />
                </SelectTrigger>
                <SelectContent>
                  {VEHICLE_TYPES.map((v) => (
                    <SelectItem key={v} value={v}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">Anything else? (optional)</Label>
              <Textarea
                id="notes"
                rows={3}
                placeholder="Availability, delivery experience, etc."
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
              />
            </div>

            <TurnstileWidget onVerify={setCaptchaToken} onExpire={() => setCaptchaToken(null)} resetSignal={captchaReset} />

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? "Submitting…" : "Apply to drive"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
