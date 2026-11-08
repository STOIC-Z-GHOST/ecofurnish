import Link from "next/link";
import { db } from "@/db";
import { sitePages } from "@/db/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireAdminPage } from "@/lib/require-admin";
import { PAGE_LABELS, PAGE_SLUGS } from "@/lib/site-page-defaults";

export default async function AdminPagesPage() {
  // Admin only: guests can't see or edit the site's wording.
  await requireAdminPage();

  const edited = new Map<string, { updatedAt: Date; updatedBy: string | null }>();
  let setupNeeded = false;
  try {
    const rows = await db.select().from(sitePages);
    for (const r of rows) edited.set(r.slug, { updatedAt: r.updatedAt, updatedBy: r.updatedBy });
  } catch (error) {
    console.error("Couldn't load the saved pages:", error);
    setupNeeded = true;
  }

  return (
    <div>
      <h2 className="mb-2 text-lg font-semibold">Pages</h2>
      <p className="mb-6 text-sm text-muted-foreground">
        Edit the wording of these pages. A page shows its built-in text until you save your own, and
        you can switch back to the built-in text any time.
      </p>

      {setupNeeded && (
        <p className="mb-6 rounded-lg border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
          The page-editing tables aren&apos;t in the database yet, so edits can&apos;t be saved. Run{" "}
          <code>batch-b-run-in-neon-first.sql</code> in the Neon SQL editor, then reload.
        </p>
      )}

      <div className="overflow-x-auto rounded-lg border border-border/60">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-muted-foreground">
            <tr>
              <th className="p-3">Page</th>
              <th className="p-3">Address</th>
              <th className="p-3">Status</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {PAGE_SLUGS.map((slug) => {
              const info = edited.get(slug);
              return (
                <tr key={slug} className="border-t border-border/60">
                  <td className="p-3 font-medium">{PAGE_LABELS[slug]}</td>
                  <td className="p-3 text-muted-foreground">
                    <Link href={`/${slug}`} target="_blank" className="hover:underline">
                      /{slug}
                    </Link>
                  </td>
                  <td className="p-3">
                    {info ? (
                      <span className="text-muted-foreground">
                        <Badge variant="default">edited</Badge>{" "}
                        {info.updatedAt.toLocaleDateString()}
                        {info.updatedBy ? ` by ${info.updatedBy}` : ""}
                      </span>
                    ) : (
                      <Badge variant="outline">built-in text</Badge>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      render={<Link href={`/admin/pages/${slug}`} />}
                      nativeButton={false}
                    >
                      Edit
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
