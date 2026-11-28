import { cache } from "react";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";

/**
 * Every on/off switch in Admin > Settings, in one list. To add a switch:
 * add a line here, then read it with getSiteSettings() where it matters.
 *
 * `default` is what a switch does until the owner changes it. The two store
 * mode switches fall back to the old environment variables, so a site that
 * already uses them keeps behaving the same.
 */
export const SETTING_DEFS = [
  {
    key: "realStock",
    group: "Store mode",
    label: "Real stock (live store)",
    description:
      "ON: every paid order lowers the real stock for everyone, and a product that sells out really shows as sold out. OFF (demo): the real number never moves, and each visitor only sees their own temporary \"bought it\" view.",
    default: process.env.DECREMENT_STOCK_ON_PAYMENT === "true",
  },
  {
    key: "autoRestock",
    group: "Store mode",
    label: "Automatic restock",
    description:
      "Sold-out products refill themselves after a few hours. Turn this off for a real store, where stock should only change when you change it.",
    default: process.env.AUTO_RESTOCK !== "off",
  },
  {
    key: "maintenance",
    group: "Visitors",
    label: "Maintenance mode",
    description:
      "Visitors see a \"back soon\" page instead of the shop. You stay able to use /admin and sign in. Customers returning from a payment still land on their order page.",
    default: false,
  },
  {
    key: "announcement",
    group: "Visitors",
    label: "Announcement bar",
    description: "A slim message bar at the top of every page, for a sale or a delay. Add the wording below.",
    default: false,
  },
  {
    key: "guestCheckout",
    group: "Checkout and accounts",
    label: "Guest checkout",
    description:
      "Let people order without an account. They give an email at checkout and can see their order in the same browser. Referral codes and store credit still need an account. OFF means everyone must sign in first.",
    default: false,
  },
  {
    key: "reviewsOpen",
    group: "Checkout and accounts",
    label: "Accept new reviews",
    description: "Turn off to pause new and edited reviews. Existing reviews stay visible.",
    default: true,
  },
  {
    key: "signUpsOpen",
    group: "Checkout and accounts",
    label: "Accept new accounts",
    description: "Turn off to pause sign-ups (email and Google/Microsoft). People who already have an account can still sign in.",
    default: true,
  },
  {
    key: "guestDashboard",
    group: "Guest admin access",
    label: "Dashboard",
    description: "Guests can see the order, revenue and stock counts. Nothing on it can be changed.",
    default: true,
  },
  {
    key: "guestProducts",
    group: "Guest admin access",
    label: "Products",
    description: "Guests can browse products and try edits. Their edits stay in their own browser and never reach the real store.",
    default: true,
  },
  {
    key: "guestOrders",
    group: "Guest admin access",
    label: "Orders",
    description: "Guests can see orders with customer details hidden, and try changing a status. Changes stay in their own browser.",
    default: true,
  },
  {
    key: "guestSettings",
    group: "Guest admin access",
    label: "Settings",
    description: "Guests can look at these switches and try them. Nothing they change is saved, so the real site is never affected.",
    default: false,
  },
  {
    key: "chatbot",
    group: "Features",
    label: "Support chatbot",
    description: "The floating leaf assistant on every page.",
    default: true,
  },
  {
    key: "installBanner",
    group: "Features",
    label: "Install app bar",
    description: "The slim bar at the top that asks visitors to add the site to their home screen.",
    default: true,
  },
  {
    key: "adBanner",
    group: "Homepage sections",
    label: "Video ad",
    description: "The video banner between the products and Our impact.",
    default: true,
  },
  {
    key: "newsletter",
    group: "Homepage sections",
    label: "Newsletter sign-up",
    description: "The email sign-up section near the bottom of the homepage.",
    default: true,
  },
  {
    key: "testimonials",
    group: "Homepage sections",
    label: "Testimonials (demo data)",
    description: "The What customers say section. These are sample reviews, so you may want to hide them on a live store.",
    default: true,
  },
  {
    key: "aboutMaker",
    group: "Pages and links",
    label: "About the maker",
    description: "The page and its footer link. When off, the address shows Page not found.",
    default: true,
  },
  {
    key: "howItsMade",
    group: "Pages and links",
    label: "How it\u2019s made",
    description: "The page for recruiters and clients, and the button that links to it.",
    default: true,
  },
] as const;

/** Wording the owner types in, shown next to a switch. */
export const TEXT_DEFS = [
  {
    key: "announcementText",
    forSwitch: "announcement",
    label: "Announcement wording",
    placeholder: "Free delivery in Addis Ababa this week",
    max: 160,
  },
  {
    key: "maintenanceMessage",
    forSwitch: "maintenance",
    label: "Message on the maintenance page",
    placeholder: "We are updating the shop and will be back soon.",
    max: 300,
  },
] as const;

export type TextKey = (typeof TEXT_DEFS)[number]["key"];
export type SettingKey = (typeof SETTING_DEFS)[number]["key"];
export type SiteSettings = Record<SettingKey, boolean> & Record<TextKey, string>;

function defaults(): SiteSettings {
  const out = {} as SiteSettings;
  for (const d of SETTING_DEFS) out[d.key] = d.default;
  for (const t of TEXT_DEFS) out[t.key] = "";
  return out;
}

/**
 * The current switches. Read once per request. If the table doesn't exist
 * yet (batch-f-run-in-neon-first.sql not run) or the database hiccups, the
 * built-in defaults are used, so a missing table can never take the site down.
 */
export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  const result = defaults();
  try {
    const rows = await db.select().from(siteSettings);
    for (const row of rows) {
      const def = SETTING_DEFS.find((d) => d.key === row.key);
      if (def) {
        result[def.key] = row.value === "true";
        continue;
      }
      const text = TEXT_DEFS.find((t) => t.key === row.key);
      if (text) result[text.key] = row.value;
    }
  } catch (error) {
    console.error("Couldn't read the site settings, using defaults:", error);
  }
  return result;
});
