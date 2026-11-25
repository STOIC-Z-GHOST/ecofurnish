"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { sendPasswordAddedEmail, sendPasswordChangedEmail } from "@/lib/email";
import { passesAllChecks } from "@/lib/password-strength";

export async function notifyPasswordChanged() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return;
  await sendPasswordChangedEmail(session.user.email, session.user.name ?? "there");
}

// Adding a password to an account that has none changes how someone can get in
// for good, so it needs a RECENT sign-in — otherwise a stolen, long-forgotten
// session could quietly set a password and keep access even after the owner
// signs out everywhere. Past this age, they just sign in again with Google
// (a few seconds) and come back.
const RECENT_SIGN_IN_MS = 60 * 60 * 1000;

/**
 * For someone who signed up with Google (or another provider) and so has no
 * password yet: adds one, so they can also sign in with their email + password
 * next time. The change-password form can't do this — there's no current
 * password to check — which is why it said "Credential account not found".
 */
export async function addPassword(newPassword: string) {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });
  if (!session?.user) return { success: false as const, error: "Please sign in again." };

  if (typeof newPassword !== "string" || !passesAllChecks(newPassword)) {
    return { success: false as const, error: "Please meet all the password requirements." };
  }

  const signedInAt = new Date(session.session.createdAt).getTime();
  if (!Number.isFinite(signedInAt) || Date.now() - signedInAt > RECENT_SIGN_IN_MS) {
    return {
      success: false as const,
      error: "For your security, please sign out and sign in again, then add your password.",
    };
  }

  const accounts = await auth.api.listUserAccounts({ headers: reqHeaders });
  if (accounts.some((a) => a.providerId === "credential")) {
    return { success: false as const, error: "You already have a password, use Change password instead." };
  }

  try {
    await auth.api.setPassword({ body: { newPassword }, headers: reqHeaders });
  } catch (error) {
    console.error("Adding a password failed:", error);
    return { success: false as const, error: "Couldn't add your password, please try again." };
  }

  // Anyone else signed in as this account (another device, or someone who
  // shouldn't be) is signed out; this device stays signed in.
  try {
    await auth.api.revokeOtherSessions({ headers: reqHeaders });
  } catch (error) {
    console.error("Couldn't sign out other sessions after adding a password:", error);
  }
  await sendPasswordAddedEmail(session.user.email, session.user.name ?? "there");
  return { success: true as const };
}
