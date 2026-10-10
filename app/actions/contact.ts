"use server";

import { sendContactMessage } from "@/lib/email";
import { allowRequest, isPlausibleEmail } from "@/lib/rate-limit";
import { verifyTurnstileToken } from "@/lib/turnstile";

export async function submitContactForm(input: {
  name: string;
  email: string;
  message: string;
  captchaToken?: string | null;
}) {
  // A server action is a public endpoint, so the types and limits the form
  // enforces in the browser mean nothing here — check everything again.
  if (
    typeof input?.name !== "string" ||
    typeof input?.email !== "string" ||
    typeof input?.message !== "string"
  ) {
    return { success: false as const, error: "Please fill in every field." };
  }
  const name = input.name.trim();
  const email = input.email.trim();
  const message = input.message.trim();

  if (!name || !email || !message) {
    return { success: false as const, error: "Please fill in every field." };
  }
  if (name.length > 100 || message.length > 5000) {
    return { success: false as const, error: "That message is too long — please shorten it." };
  }
  if (!isPlausibleEmail(email)) {
    return { success: false as const, error: "Please enter a valid email address." };
  }
  if (!(await allowRequest("contact", 5, 10 * 60 * 1000))) {
    return { success: false as const, error: "You've sent a few messages already — please try again in a little while." };
  }
  // Verified here, inside the action, so calling the action directly (skipping
  // the form) can't dodge it. A token works once, so this is the only check.
  if (typeof input.captchaToken !== "string" || !input.captchaToken) {
    return { success: false as const, error: "Please complete the captcha." };
  }
  if (!(await verifyTurnstileToken(input.captchaToken))) {
    return { success: false as const, error: "Captcha verification failed — please try again." };
  }
  return sendContactMessage({ name, email, message });
}
