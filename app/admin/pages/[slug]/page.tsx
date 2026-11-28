import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAdminViewPage } from "@/lib/require-admin";
import { DemoPageEditor } from "@/components/admin/demo/DemoAdmin";
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
  const { isGuest } = await requireAdminViewPage("guestPages");
  const { slug } = await params;
  if (!isSitePageSlug(slug)) notFound();
  // A guest gets the built-in text in an editor that can't save anything.
  if (isGuest) return <DemoPageEditor slug={slug} />;

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
