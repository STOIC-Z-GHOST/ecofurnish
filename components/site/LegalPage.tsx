import { getSitePage } from "@/lib/site-pages";
import { DEFAULT_UPDATED_LABEL, type SitePageSlug } from "@/lib/site-page-defaults";
import { MarkdownContent } from "./MarkdownContent";

/**
 * A text page (Terms, Privacy, Cookies, Returns, Dispute Resolution) whose
 * wording the admin can edit. Same layout the hard-coded pages had; the text
 * comes from the editor's saved version or, until there is one, the built-in
 * default. "Last updated" now reflects the real edit date (the hard-coded
 * pages printed today's date on every visit, which wasn't true).
 */
export async function LegalPage({ slug }: { slug: Exclude<SitePageSlug, "about"> }) {
  const page = await getSitePage(slug);
  const updated = page.updatedAt
    ? page.updatedAt.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
    : DEFAULT_UPDATED_LABEL;

  return (
    <div className="container mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-3xl font-extrabold tracking-tight">{page.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: {updated}</p>
      <div className="mt-8">
        <MarkdownContent>{page.body}</MarkdownContent>
      </div>
    </div>
  );
}
