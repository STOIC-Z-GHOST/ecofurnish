import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { sitePageRevisions, sitePages } from "@/db/schema";
import {
  DEFAULT_ABOUT,
  DEFAULT_MARKDOWN_PAGES,
  PAGE_LABELS,
  type AboutContent,
  type SitePageSlug,
} from "@/lib/site-page-defaults";

export interface ResolvedPage {
  title: string;
  body: string;
  /** When the saved version was last edited; null for the built-in text. */
  updatedAt: Date | null;
  updatedBy: string | null;
  /** True if an admin has saved their own version. */
  custom: boolean;
}

/**
 * The text of an editable page: the admin's saved version if there is one,
 * otherwise the built-in default. Never throws — if the database can't be
 * read (or the table doesn't exist yet) the visitor simply gets the default.
 */
export async function getSitePage(slug: SitePageSlug): Promise<ResolvedPage> {
  try {
    const [row] = await db.select().from(sitePages).where(eq(sitePages.slug, slug)).limit(1);
    if (row) {
      return {
        title: row.title,
        body: row.body,
        updatedAt: row.updatedAt,
        updatedBy: row.updatedBy,
        custom: true,
      };
    }
  } catch (error) {
    console.error(`Couldn't load page "${slug}", using the built-in text:`, error);
  }
  const fallback =
    slug === "about"
      ? { title: PAGE_LABELS.about, body: JSON.stringify(DEFAULT_ABOUT) }
      : DEFAULT_MARKDOWN_PAGES[slug];
  return { ...fallback, updatedAt: null, updatedBy: null, custom: false };
}

const MAX_SHORT = 300;
const MAX_LONG = 3000;

function text(value: unknown, max: number, fallback: string): string {
  return typeof value === "string" && value.trim() !== "" ? value.slice(0, max) : fallback;
}

/**
 * Reads the About page's saved JSON, tolerating anything odd: a missing or
 * malformed value falls back, field by field, to the built-in text, so a bad
 * save can never break the page.
 */
export function parseAboutContent(body: string): AboutContent {
  let raw: Record<string, unknown> = {};
  try {
    const parsed: unknown = JSON.parse(body);
    if (parsed && typeof parsed === "object") raw = parsed as Record<string, unknown>;
  } catch {
    // keep the defaults
  }
  const rawCards = Array.isArray(raw.cards) ? raw.cards : [];
  const cards = DEFAULT_ABOUT.cards.map((fallback, i) => {
    const c = (rawCards[i] ?? {}) as Record<string, unknown>;
    return {
      title: text(c.title, MAX_SHORT, fallback.title),
      text: text(c.text, MAX_LONG, fallback.text),
    };
  });
  return {
    badge: text(raw.badge, MAX_SHORT, DEFAULT_ABOUT.badge),
    heading: text(raw.heading, MAX_SHORT, DEFAULT_ABOUT.heading),
    intro: text(raw.intro, MAX_LONG, DEFAULT_ABOUT.intro),
    cards,
    ctaHeading: text(raw.ctaHeading, MAX_SHORT, DEFAULT_ABOUT.ctaHeading),
    ctaText: text(raw.ctaText, MAX_LONG, DEFAULT_ABOUT.ctaText),
  };
}

export async function getPageRevisions(slug: SitePageSlug, limit = 20) {
  try {
    return await db
      .select()
      .from(sitePageRevisions)
      .where(eq(sitePageRevisions.slug, slug))
      .orderBy(desc(sitePageRevisions.savedAt))
      .limit(limit);
  } catch (error) {
    console.error("Couldn't load page history:", error);
    return [];
  }
}
