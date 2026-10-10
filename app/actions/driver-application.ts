"use server";

import { db } from "@/db";
import { driverApplications } from "@/db/schema";
import { sendDriverApplicationReceivedEmail } from "@/lib/email";
import { VEHICLE_TYPES } from "@/lib/vehicle-types";
import { allowRequest, isPlausibleEmail } from "@/lib/rate-limit";
import { verifyTurnstileToken } from "@/lib/turnstile";

export interface DriverApplicationInput {
  fullName: string;
  phone: string;
  email: string;
  city: string;
  vehicleType: string;
  notes: string;
  captchaToken?: string | null;
}

// The Turnstile token arrives with the application and is verified in here,
// before anything is stored — see the check below.
export async function submitDriverApplication(input: DriverApplicationInput) {
  // Public endpoint: don't assume the browser form's types or limits held.
  const fields = [input?.fullName, input?.phone, input?.email, input?.city, input?.vehicleType, input?.notes];
  if (fields.some((f) => typeof f !== "string")) {
    return { success: false as const, error: "Please fill in your name, phone, and city." };
  }

  const fullName = input.fullName.trim();
  const phone = input.phone.trim();
  const city = input.city.trim();
  const email = input.email.trim();

  if (!fullName || !phone || !city) {
    return { success: false as const, error: "Please fill in your name, phone, and city." };
  }
  if (!(VEHICLE_TYPES as readonly string[]).includes(input.vehicleType)) {
    return { success: false as const, error: "Please select a vehicle type." };
  }
  if (fullName.length > 100 || phone.length > 30 || city.length > 100 || input.notes.length > 1000) {
    return { success: false as const, error: "One of your answers is too long — please shorten it." };
  }
  if (email && !isPlausibleEmail(email)) {
    return { success: false as const, error: "Please enter a valid email address, or leave it blank." };
  }
  if (!(await allowRequest("driver-application", 5, 60 * 60 * 1000))) {
    return { success: false as const, error: "Too many applications from this connection — please try again later." };
  }
  if (typeof input.captchaToken !== "string" || !input.captchaToken) {
    return { success: false as const, error: "Please complete the captcha." };
  }
  if (!(await verifyTurnstileToken(input.captchaToken))) {
    return { success: false as const, error: "Captcha verification failed — please try again." };
  }

  await db.insert(driverApplications).values({
    fullName,
    phone,
    email: email || null,
    city,
    vehicleType: input.vehicleType,
    notes: input.notes.trim() || null,
  });

  // Email is optional on this form (phone is the required contact
  // method — see driverApplications.email in db/schema.ts), so this is
  // best-effort: nothing to send a receipt to if they left it blank.
  if (email) {
    await sendDriverApplicationReceivedEmail(email, fullName);
  }

  return { success: true as const };
}
