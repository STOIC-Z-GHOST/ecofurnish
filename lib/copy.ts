/**
 * Em dashes read as machine-written in web copy, so this site doesn't use
 * them. Text typed into the database (product descriptions, page bodies)
 * may still contain some, so anything that shows that kind of text runs it
 * through this first: "word, then word" replaces "word [em dash] word".
 * Only the em dash is touched; ordinary hyphens ("built-in", markdown list
 * bullets) are left alone.
 *
 * The character is built from its code point on purpose, so no search and
 * replace over the source can ever turn this pattern into something else.
 */
const EM_DASH = new RegExp("\\s*" + String.fromCharCode(0x2014) + "\\s*", "g");

export function noDash(text: string): string;
export function noDash(text: string | null | undefined): string | null | undefined;
export function noDash(text: string | null | undefined) {
  if (!text) return text;
  return text.replace(EM_DASH, ", ");
}
