import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAdminPage } from "@/lib/require-admin";
import { getPageRevisions, getSitePage, parseAboutContent } from "@/lib/site-pages";
import {
  DEFAULT_ABOUT,
  DEFAULT_MARKDOWN_PAGES,
  PAGE_LABELS,
  isSitePageSlug,
} from "@/lib/site-page-defaults";
import { AboutPageEditor } from "@/components/admin/about-page-editor";
import { MarkdownPageEditor } from "@/components/admin/markdown-page-editor";

export default async function EditPagePage({ params }: { params: Promise<{ slug: string }> }) {
  await requireAdminPage();
  const { slug } = await params;
  if (!isSitePageSlug(slug)) notFound();

  const [page, revisions] = await Promise.all([getSitePage(slug), getPageRevisions(slug)]);

  return (
    <div>
      <Link
        href="/admin/pages"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> All pages
      </Link>
      <h2 className="mb-6 text-lg font-semibold">Edit: {PAGE_LABELS[slug]}</h2>

      {slug === "about" ? (
        <AboutPageEditor
          initial={parseAboutContent(page.body)}
          defaults={DEFAULT_ABOUT}
          custom={page.custom}
        />
      ) : (
        <MarkdownPageEditor
          slug={slug}
          initialTitle={page.title}
          initialBody={page.body}
          defaultTitle={DEFAULT_MARKDOWN_PAGES[slug].title}
          defaultBody={DEFAULT_MARKDOWN_PAGES[slug].body}
          custom={page.custom}
          revisions={revisions.map((r) => ({
            id: r.id,
            title: r.title,
            body: r.body,
            savedAt: r.savedAt.toISOString(),
            savedBy: r.savedBy,
          }))}
        />
      )}
    </div>
  );
}
