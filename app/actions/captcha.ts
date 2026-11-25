"use server";

import { verifyTurnstileToken } from "@/lib/turnstile";

export async function verifyCaptcha(token: string | null) {
  if (!token) return { success: false as const, error: "Please complete the captcha." };
  const valid = await verifyTurnstileToken(token);
  if (!valid) return { success: false as const, error: "Captcha verification failed, try again." };
  return { success: true as const };
}
