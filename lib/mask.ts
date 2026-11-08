/**
 * Masking for what a read-only guest admin is allowed to see. The masking
 * is done on the server, before the data is handed to the page, so a full
 * value never reaches a guest's browser (hiding it with CSS wouldn't help —
 * it would still be in the page source).
 */

// A fixed number of stars, not one per hidden letter: the length of a
// masked address would otherwise tell you how long the real one is.
const EMAIL_STARS = "***********"; // 11, as in g***********@gmail.com

/** greatuser@gmail.com -> g***********@gmail.com */
export function maskEmail(email: string | null | undefined): string {
  if (!email) return "";
  const at = email.lastIndexOf("@");
  if (at < 1) return "***";
  return `${email[0]}${EMAIL_STARS}${email.slice(at)}`;
}

/** Abebe Kebede -> A**** K**** (initial of each word only). */
export function maskName(name: string | null | undefined): string {
  if (!name) return "";
  return name
    .trim()
    .split(/\s+/)
    .map((word) => `${word[0]}****`)
    .join(" ");
}

/** 0911223344 -> ********44 (last two digits only). */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length <= 2) return "**";
  return `********${digits.slice(-2)}`;
}
