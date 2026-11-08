"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownContent } from "@/components/site/MarkdownContent";
import { resetPage, savePage } from "@/app/admin/pages/actions";

export type RevisionRow = {
  id: string;
  title: string;
  body: string;
  savedAt: string; // ISO
  savedBy: string | null;
};

export function MarkdownPageEditor({
  slug,
  initialTitle,
  initialBody,
  defaultTitle,
  defaultBody,
  custom,
  revisions,
}: {
  slug: string;
  initialTitle: string;
  initialBody: string;
  defaultTitle: string;
  defaultBody: string;
  custom: boolean;
  revisions: RevisionRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);
  const dirty = title !== initialTitle || body !== initialBody;

  function save() {
    startTransition(async () => {
      try {
        const result = await savePage(slug, title, body);
        if (result.success) {
          toast.success("Saved — the page is updated.");
          router.refresh();
        } else {
          toast.error(result.error);
        }
      } catch {
        toast.error("Something went wrong — try again.");
      }
    });
  }

  function reset() {
    if (
      !window.confirm(
        "Switch this page back to its built-in text? Your saved version is removed from the page (it stays in the history below)."
      )
    ) {
      return;
    }
    startTransition(async () => {
      try {
        const result = await resetPage(slug);
        if (result.success) {
          setTitle(defaultTitle);
          setBody(defaultBody);
          toast.success("Back to the built-in text.");
          router.refresh();
        } else {
          toast.error(result.error);
        }
      } catch {
        toast.error("Something went wrong — try again.");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="page-title" className="mb-1 block text-sm font-medium">
          Page title
        </label>
        <Input id="page-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <label htmlFor="page-body" className="mb-1 block text-sm font-medium">
            Text (Markdown)
          </label>
          <Textarea
            id="page-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={26}
            className="font-mono text-sm"
          />
          <p className="mt-2 text-xs text-muted-foreground">
            <code>## Heading</code> · <code>**bold**</code> · <code>- list item</code> ·{" "}
            <code>[link text](/contact)</code> · <code>&gt; note box</code>. Raw HTML isn&apos;t
            allowed — it&apos;s shown as plain text.
          </p>
        </div>
        <div>
          <p className="mb-1 text-sm font-medium">Preview</p>
          <div className="rounded-lg border border-border/60 p-5">
            <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
            <div className="mt-6">
              <MarkdownContent>{body}</MarkdownContent>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={save} disabled={pending || !dirty}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
        {custom && (
          <Button variant="outline" onClick={reset} disabled={pending}>
            Back to built-in text
          </Button>
        )}
        <Button
          variant="ghost"
          nativeButton={false}
          render={<a href={`/${slug}`} target="_blank" rel="noopener noreferrer" />}
        >
          <ExternalLink className="mr-1.5 h-4 w-4" />
          View live page
        </Button>
        {dirty && <span className="text-xs text-muted-foreground">Unsaved changes</span>}
      </div>

      <div className="rounded-lg border border-border/60 p-5">
        <h3 className="font-semibold">History</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Every save is kept (the last 25). &quot;Load&quot; puts an older version in the editor — it only
          goes live when you press Save.
        </p>
        <ul className="mt-3 divide-y divide-border/60 text-sm">
          <li className="flex items-center justify-between gap-3 py-2">
            <span className="text-muted-foreground">Built-in text (the original wording)</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setTitle(defaultTitle);
                setBody(defaultBody);
              }}
            >
              Load
            </Button>
          </li>
          {revisions.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 py-2">
              <span className="text-muted-foreground">
                {new Date(r.savedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                {r.savedBy ? ` · ${r.savedBy}` : ""}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setTitle(r.title);
                  setBody(r.body);
                }}
              >
                Load
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
