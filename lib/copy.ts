/**
 * Em dashes read as machine-written in web copy, so this site doesn't use
 * them. Text typed into the database (product descriptions, page bodies)
 * may still contain some, so anything that shows that kind of text runs it
 * through this first: " word — word" becomes "word, word".
 */
export function noDash(text: string): string;
export function noDash(text: string | null | undefined): string | null | undefined;
export function noDash(text: string | null | undefined) {
  if (!text) return text;
  return text.replace(/\s*-\s*/g, ", ");
}
