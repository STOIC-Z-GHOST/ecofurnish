"use client";

import { useState } from "react";
import { Loader2, Mail, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitContactForm } from "@/app/actions/contact";
import { TurnstileWidget } from "@/components/turnstile-widget";
import { toast } from "sonner";

export default function ContactPage() {
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  // Bumped after every attempt to get a fresh token — a token is single-use.
  const [captchaReset, setCaptchaReset] = useState(0);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!captchaToken) {
      toast.error("Please complete the captcha first.");
      return;
    }
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const result = await submitContactForm({
      name: String(formData.get("name") || ""),
      email: String(formData.get("email") || ""),
      message: String(formData.get("message") || ""),
      captchaToken,
    });

    setSubmitting(false);
    setCaptchaToken(null);
    setCaptchaReset((n) => n + 1);
    if (result.success) {
      setSent(true);
    } else {
      toast.error(
        "error" in result && result.error
          ? result.error
          : "Couldn't send your message — please try again in a moment."
      );
    }
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-16">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight">Get in Touch</h1>
        <p className="mt-3 text-muted-foreground">
          Questions about an order, wholesale inquiries, or just want to say hi.
        </p>
      </div>

      <div className="grid gap-10 md:grid-cols-[1fr_1.4fr]">
        <div className="space-y-6">
          <div className="flex items-start gap-3">
            <Mail className="mt-0.5 h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">Email</p>
              <p className="text-sm text-muted-foreground">admin@ecofurnish.de5.net</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">Based in</p>
              <p className="text-sm text-muted-foreground">Addis Ababa, Ethiopia</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border/60 p-6">
          {sent ? (
            <div className="py-8 text-center">
              <h2 className="text-xl font-semibold">Message sent</h2>
              <p className="mt-2 text-muted-foreground">
                Thanks for reaching out — we&apos;ll get back to you soon.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" name="name" required autoComplete="name" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" required autoComplete="email" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="message">Message</Label>
                <Textarea id="message" name="message" required rows={5} />
              </div>
              <TurnstileWidget
                onVerify={setCaptchaToken}
                onExpire={() => setCaptchaToken(null)}
                resetSignal={captchaReset}
              />
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {submitting ? "Sending…" : "Send Message"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
