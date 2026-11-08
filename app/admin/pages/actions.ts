"use server";

import { revalidatePath } from "next/cache";
import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { sitePageRevisions, sitePages } from "@/db/schema";
import { requireAdmin } from "@/lib/require-admin";
import { parseAboutContent } from "@/lib/site-pages";
import {
  PAGE_LABELS,
  isSitePageSlug,
  type AboutContent,
  type SitePageSlug,
} from "@/lib/site-page-defaults";

const MAX_TITLE = 200;
const MAX_BODY = 60_000;
const KEEP_REVISIONS = 25;

type Result = { success: true } | { success: false; error: string };

const SETUP_ERROR =
  "Couldn't save — has the site_pages table been created in the database? (Run batch-b-run-in-neon-first.sql.)";

async function saveRow(slug: SitePageSlug, title: string, body: string, by: string): Promise<Result> {
  try {
    await db
      .insert(sitePages)
      .values({ slug, title, body, updatedBy: by })
      .onConflictDoUpdate({
        target: sitePages.slug,
        set: { title, body, updatedAt: new Date(), updatedBy: by },
      });
    // Keep a history so a bad edit to legal text can be undone, but not forever.
    await db.insert(sitePageRevisions).values({ slug, title, body, savedBy: by });
    const stale = await db
      .select({ id: sitePageRevisions.id })
      .from(sitePageRevisions)
      .where(eq(sitePageRevisions.slug, slug))
      .orderBy(desc(sitePageRevisions.savedAt))
      .offset(KEEP_REVISIONS);
    if (stale.length > 0) {
      await db.delete(sitePageRevisions).where(
        inArray(
          sitePageRevisions.id,
          stale.map((r) => r.id)
        )
      );
    }
  } catch (error) {
    console.error("Couldn't save the page:", error);
    return { success: false, error: SETUP_ERROR };
  }
  revalidatePath(`/${slug}`);
  revalidatePath("/admin/pages");
  return { success: true };
}

/** Saves a Markdown page (Terms, Privacy, Cookies, Returns, Dispute Resolution). */
export async function savePage(slug: string, title: string, body: string): Promise<Result> {
  const session = await requireAdmin();
  if (!isSitePageSlug(slug) || slug === "about") {
    return { success: false, error: "Unknown page." };
  }
  const cleanTitle = title.trim();
  if (cleanTitle === "" || cleanTitle.length > MAX_TITLE) {
    return { success: false, error: `The title needs 1–${MAX_TITLE} characters.` };
  }
  if (body.trim() === "") return { success: false, error: "The page can't be empty." };
  if (body.length > MAX_BODY) {
    return { success: false, error: `The page is too long (limit ${MAX_BODY.toLocaleString()} characters).` };
  }
  return saveRow(slug, cleanTitle, body, session.user.email);
}

/** Saves the About page's structured text. */
export async function saveAboutPage(content: AboutContent): Promise<Result> {
  const session = await requireAdmin();
  // Re-read through the same tolerant parser the page uses: it trims
  // lengths and fills any blank field with the built-in wording.
  const clean = parseAboutContent(JSON.stringify(content));
  return saveRow("about", PAGE_LABELS.about, JSON.stringify(clean), session.user.email);
}

/** Throws away the saved version so the built-in text shows again. */
export async function resetPage(slug: string): Promise<Result> {
  await requireAdmin();
  if (!isSitePageSlug(slug)) return { success: false, error: "Unknown page." };
  try {
    await db.delete(sitePages).where(eq(sitePages.slug, slug));
  } catch (error) {
    console.error("Couldn't reset the page:", error);
    return { success: false, error: SETUP_ERROR };
  }
  revalidatePath(`/${slug}`);
  revalidatePath("/admin/pages");
  return { success: true };
}
