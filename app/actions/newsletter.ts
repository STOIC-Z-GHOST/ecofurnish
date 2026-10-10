"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/db";
import { newsletterSubscribers } from "@/db/schema";
import { auth } from "@/lib/auth";
import { sendNewsletterWelcomeEmail } from "@/lib/email";
import { allowRequest, isPlausibleEmail } from "@/lib/rate-limit";

export async function subscribeToNewsletter(rawEmail: string) {
  const email = typeof rawEmail === "string" ? rawEmail.trim() : "";
  if (!isPlausibleEmail(email)) {
    return { success: false as const, error: "Enter a valid email address." };
  }
  if (!(await allowRequest("newsletter", 10, 10 * 60 * 1000))) {
    return { success: false as const, error: "Too many attempts — please try again in a little while." };
  }
  let isNewSubscriber = false;
  try {
    // .returning() is empty when onConflictDoNothing actually hit a
    // conflict — that's how this tells "brand new" apart from "already
    // subscribed, resubmitted the form" without a separate lookup query.
    const inserted = await db
      .insert(newsletterSubscribers)
      .values({ email })
      .onConflictDoNothing()
      .returning({ id: newsletterSubscribers.id });
    isNewSubscriber = inserted.length > 0;
  } catch (err) {
    console.error("Failed to save newsletter subscriber:", err);
    return { success: false as const, error: "Something went wrong — try again." };
  }
  // Only a genuinely new subscriber gets the welcome email — resubmitting
  // an already-subscribed address used to fire it again every time.
  if (isNewSubscriber) {
    await sendNewsletterWelcomeEmail(email);
  }
  return { success: true as const };
}

/** Used to show the correct initial state for a signed-in visitor — see
 * components/home/Newsletter.tsx. Only ever answers for the signed-in
 * user's OWN email: as a public endpoint taking any address, it would let
 * anyone check whether a given person is on the list. */
export async function isSubscribedToNewsletter(email: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (
    !session?.user?.email ||
    typeof email !== "string" ||
    session.user.email.trim().toLowerCase() !== email.trim().toLowerCase()
  ) {
    return false;
  }
  const [row] = await db
    .select({ id: newsletterSubscribers.id })
    .from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.email, email))
    .limit(1);
  return Boolean(row);
}
