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

export type SettingKey = (typeof SETTING_DEFS)[number]["key"];
export type SiteSettings = Record<SettingKey, boolean>;

function defaults(): SiteSettings {
  const out = {} as SiteSettings;
  for (const d of SETTING_DEFS) out[d.key] = d.default;
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
      if (def) result[def.key] = row.value === "true";
    }
  } catch (error) {
    console.error("Couldn't read the site settings, using defaults:", error);
  }
  return result;
});
