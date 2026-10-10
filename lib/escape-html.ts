/**
 * Escapes text so it can be dropped into HTML as plain text (or inside a
 * double-quoted attribute) without being interpreted as markup. Use it on
 * ANY value a visitor, customer or applicant typed — names, messages,
 * emails, free-text reasons — before it goes into an HTML email, an HTML
 * page response, or a Telegram message sent with parse_mode "HTML".
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
