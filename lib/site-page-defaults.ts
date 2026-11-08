// Built-in text for the pages the admin can edit (Admin -> Pages).
//
// A page shows THIS text until the admin saves their own version, which is
// stored in the site_pages table and takes over. "Reset to built-in text" in
// the editor deletes the saved version and brings this back. These were the
// hard-coded pages before editing existed, converted to Markdown as-is
// (apart from the Return Policy's notice box, which had been copied from the
// Cookie Notice and talked about browser storage).

export const PAGE_SLUGS = ["about", "terms", "privacy", "cookies", "returns", "dispute-resolution"] as const;
export type SitePageSlug = (typeof PAGE_SLUGS)[number];

export function isSitePageSlug(value: string): value is SitePageSlug {
  return (PAGE_SLUGS as readonly string[]).includes(value);
}

// "Last updated" shown on a built-in page that has never been edited.
export const DEFAULT_UPDATED_LABEL = "November 2026";

export interface AboutContent {
  badge: string;
  heading: string;
  intro: string;
  cards: { title: string; text: string }[]; // always 3
  ctaHeading: string;
  ctaText: string;
}

export const DEFAULT_ABOUT: AboutContent = {
  badge: "Our Story",
  heading: "Furniture that cleans our streets",
  intro:
    "EcoFurnish started with a simple question: what if the plastic waste piling up around Addis Ababa could become something you'd actually want in your living room? Every piece we build answers that question a little further.",
  cards: [
    {
      title: "Recycled by design",
      text: "We source reclaimed plastic and wood locally, then work with small workshops to turn it into furniture built to last — not to be replaced next season.",
    },
    {
      title: "Transparent impact",
      text: 'Every product listing shows exactly how much plastic it diverted from landfills — no vague "eco-friendly" claims, just a real number per item.',
    },
    {
      title: "Made close to home",
      text: "Every order ships from Addis Ababa, which keeps delivery fast and transport emissions low for customers across Ethiopia.",
    },
  ],
  ctaHeading: "Want to see it for yourself?",
  ctaText:
    "Browse the current catalog, or get in touch if you're a retailer interested in stocking EcoFurnish pieces.",
};

export const PAGE_LABELS: Record<SitePageSlug, string> = {
  about: "About us",
  terms: "Terms of Service",
  privacy: "Privacy Policy",
  cookies: "Cookie Notice",
  returns: "Return Policy",
  "dispute-resolution": "Dispute Resolution Policy",
};

export const DEFAULT_MARKDOWN_PAGES: Record<Exclude<SitePageSlug, "about">, { title: string; body: string }> = {
  "terms": {
    title: "Terms of Service",
    body: "> This is a template starting point \u2014 it isn't legal advice. Have it reviewed before relying on it for a real business.\n\n## Using this site\n\nBy creating an account or placing an order, you agree to these terms. You must be able to form a legally binding contract to use this site.\n\n## Orders and payment\n\nPlacing an order is an offer to buy, which we may accept or decline (for example, if an item is out of stock or priced incorrectly). Payment is processed securely by Chapa \u2014 we never see or store your card details. Prices, product descriptions, and availability may change at any time.\n\n## Returns\n\nSee our [Return Policy](/returns) for return windows, conditions, and how to start a return.\n\n## Your account\n\nYou're responsible for keeping your password secure and for activity that happens under your account. Let us know right away if you think someone else has access to it.\n\n## Your data\n\nSee our [Privacy Policy](/privacy) for what we collect and how it's used, and our [Cookie Notice](/cookies) for what's stored in your browser.\n\n## Disputes\n\nIf something goes wrong with an order or charge, see our [Dispute Resolution Policy](/dispute-resolution) for how we handle it.\n\n## Governing law\n\nThese terms are governed by the laws of Ethiopia.\n\n## Contact\n\nQuestions about these terms can be sent through the [contact page](/contact).",
  },
  "privacy": {
    title: "Privacy Policy",
    body: "> This is a template covering what EcoFurnish's own code actually collects \u2014 it's a reasonable starting point, not a substitute for legal advice.\n\n## What we collect\n\nWhen you place an order, we collect your name, email, phone number, and shipping address to fulfil it. If you create an account, we store your name, email, and a securely hashed password. If you use the contact form, we collect your name, email, and message.\n\n## What we don't collect\n\nWe never see or store your payment card details \u2014 those are handled entirely by our payment provider, Chapa.\n\n## Cookies and local storage\n\nYour cart, wishlist, and theme preference (light/dark) are stored in your browser's local storage, not on our servers. Signing in sets a session cookie so you stay logged in. See our [Cookie Notice](/cookies) for the full list.\n\n## Third parties\n\nWe share order details with Chapa to process payment, and use Resend to send order confirmation and contact form emails. Neither is used for advertising.\n\n## Deleting your data\n\nIf you have an account, sign in and go to [Account](/account), then choose Delete Account. You'll get a confirmation email \u2014 clicking the link in it permanently deletes your account and personal data. If you can't sign in (for example you've lost access to the email or social account you signed up with), reach us through the [contact page](/contact) and we'll delete it manually \u2014 we'll ask enough about the order or account to make sure we're deleting the right one.\n\n## Contact\n\nQuestions about your data can be sent through the [contact page](/contact).",
  },
  "cookies": {
    title: "Cookie Notice",
    body: "> This is a template covering what EcoFurnish's own code actually stores in your browser \u2014 it's a reasonable starting point, not a substitute for legal advice.\n\n## What this covers\n\nThis notice is about cookies and the similar browser storage (local storage) this site uses \u2014 see our [Privacy Policy](/privacy) for what we do with any personal data collected more broadly.\n\n## Essential cookies\n\nThese are required for the site to function and can't be turned off:\n\n-   A session cookie that keeps you signed in once you log in.\n-   A referral cookie (kept for 30 days) that remembers which referral link, if any, brought you here \u2014 so the right person gets credit for a signup or order.\n\n## Local storage (not technically cookies, but similar)\n\nThese stay on your device and are never sent to a server on their own:\n\n-   Your cart and wishlist contents.\n-   Your recently-viewed products, used for \u201cYour Recent Finds\u201d and \u201cPick Up From Where You Left Off\u201d on the homepage.\n-   Your light/dark theme choice.\n-   Whether you've dismissed the \u201cinstall app\u201d prompt.\n\n## Analytics\n\nWe use Vercel Analytics to see aggregate traffic and page views. It's cookieless by design and doesn't track you individually across sites.\n\n## No advertising cookies\n\nWe don't use third-party advertising or cross-site tracking cookies, and we don't sell browsing data.\n\n## Managing cookies\n\nMost browsers let you block or delete cookies in their settings. Blocking the essential ones above will likely break the ability to stay signed in. Clearing local storage will clear your cart, wishlist, and recently-viewed history on this device.\n\n## Contact\n\nQuestions about this notice can be sent through the [contact page](/contact).",
  },
  "returns": {
    title: "Return Policy",
    body: "> This is a template starting point for a return policy \u2014 it isn't legal advice. Have it reviewed before relying on it for a real business.\n\n## 30-day return window\n\nYou can return most items within 30 days of delivery for a refund. The 30 days is counted from the delivery date on your order, not the order date.\n\n## Condition\n\nItems must be unused, in their original condition, and in the original packaging. Items that show signs of use or assembly can't be accepted for a refund.\n\n## Return shipping\n\nReturn shipping is paid by the buyer, unless the item arrived damaged, defective, or wasn't what you ordered \u2014 in that case we cover it.\n\n## Refunds\n\nOnce we've received and inspected the returned item, we'll process your refund to your original payment method. Refunds can take a few business days to appear, depending on your bank or mobile money provider.\n\n## How to start a return\n\nReach out through the [contact page](/contact) with your order number and which item(s) you'd like to return, and we'll walk you through the next steps.",
  },
  "dispute-resolution": {
    title: "Dispute Resolution Policy",
    body: "> This is a template starting point \u2014 not a substitute for legal advice.\n\n## Talk to us first\n\nMost order problems \u2014 wrong item, damage in transit, a payment that didn't go through cleanly \u2014 are fastest to sort out directly. Reach out through the [contact page](/contact) with your order number and we will look into it.\n\n## Order and delivery issues\n\nFor a missing, damaged, or incorrect delivery, tell us within 7 days of the delivery date so we can investigate while it's still fresh with our dispatch and delivery records. See our [Return Policy](/returns) for returns and refunds specifically.\n\n## Payment disputes\n\nPayments are processed by Chapa. If a charge looks wrong, contact us first with your order number \u2014 most issues (a duplicate charge, a failed payment that still debited you) are resolved faster this way than starting a chargeback, which can take longer and puts the order on hold while it's investigated.\n\n## If we can't agree\n\nIf we're unable to resolve something directly, either side can propose mediation before pursuing anything more formal. Any dispute that isn't resolved through mediation is subject to the laws of Ethiopia, as set out in our [Terms of Service](/terms).\n\n## Contact\n\nReach us through the [contact page](/contact) with your order number and a description of the issue, and we'll get back to you.",
  },
};
