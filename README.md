# EcoFurnish

**Sustainable furniture, built from recycled materials — a full-stack e-commerce platform.**

🔗 **Live site:** [ecofurnish.de5.net](https://ecofurnish.de5.net)

EcoFurnish is a real, deployed online store for furniture built from reclaimed plastic and wood, shipped from Addis Ababa. Every product listing shows exactly how much plastic it diverted from a landfill — no vague "eco-friendly" claims, just a real number per item.

This repo is the full source: storefront, checkout, customer accounts, an admin dashboard, and a couple of AI-assisted features layered on top.

---

## Features

**Storefront**
- Product catalog with search, category filters, and multi-currency pricing
- Hover-to-preview product cards, wishlist, cart, and reviews/ratings
- Installable PWA (offline-ready shell, home-screen install prompt, dark/light theme)

**Accounts & checkout**
- Email/password auth (Better Auth) — profile, avatar upload, password change, currency preference
- Secure checkout via Chapa (cards, Telebirr, CBE Birr, and bank transfer), server-verified before an order is marked paid
- Order history with a visual order-tracking timeline (Placed → Processing → Shipped → Delivered)
- A referral program with real rewards applied at checkout
- A personal "impact" total — kg of plastic diverted from landfill, summed across a customer's own orders

**Admin**
- Product and order management, with per-order tracking notes
- A daily business digest (revenue, orders, top products) delivered automatically over Telegram

**AI-assisted features**
- A storefront support chat widget, grounded only in real store data (product count, delivery, checkout steps, mission) — it's explicitly instructed to refuse and redirect rather than invent an answer for anything outside that
- A personal Telegram bot for quick, natural-language access to the same store data

---

## Tech stack

| | |
|---|---|
| Framework | Next.js (App Router), TypeScript |
| Styling | Tailwind CSS, shadcn/ui, Base UI |
| Database | Postgres (Neon), Drizzle ORM |
| Auth | Better Auth |
| Payments | Chapa |
| Email | Resend |
| File storage | Vercel Blob |
| AI | Gemini, with Groq as a fallback provider |
| Hosting | Vercel |

## A few notable decisions

- **The support bot only knows what it's explicitly given.** Its facts live in their own module, deliberately separate from the admin dashboard's real business data — if a fact would be sensitive, it simply isn't passed in, so there's nothing for the model to leak even if asked.
- **Reorder uses live product data, not the order snapshot.** Order line items freeze the name/price at purchase time (so a later price change never rewrites history), but re-adding a past order to your cart pulls the *current* price, image, and stock — so you're not charged yesterday's price by mistake.
- **The order timeline reads off the same status field the admin panel writes to.** No separate tracking system to keep in sync — one source of truth, both sides.

---

This repo doesn't include local setup/installation instructions — the site depends on a live Postgres database, and API keys for auth, payments, email, and AI providers that aren't meant to be shared, so running it outside of its deployed environment isn't really practical. See it live instead: **[ecofurnish.de5.net](https://ecofurnish.de5.net)**

---

Designed & built by **NF** — [github.com/STOIC-Z-GHOST](https://github.com/STOIC-Z-GHOST)
