"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { resetPage, saveAboutPage } from "@/app/admin/pages/actions";
import type { AboutContent } from "@/lib/site-page-defaults";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

/**
 * The About page isn't free-form text — it's a hero, three cards and a call
 * to action laid out by the design — so it's edited as a form instead of
 * Markdown. The icons and the Browse / Contact buttons stay as designed.
 */
export function AboutPageEditor({
  initial,
  defaults,
  custom,
}: {
  initial: AboutContent;
  defaults: AboutContent;
  custom: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [about, setAbout] = useState<AboutContent>(initial);
  const dirty = JSON.stringify(about) !== JSON.stringify(initial);

  const set = <K extends keyof AboutContent>(key: K, value: AboutContent[K]) =>
    setAbout((a) => ({ ...a, [key]: value }));
  const setCard = (i: number, patch: Partial<AboutContent["cards"][number]>) =>
    setAbout((a) => ({ ...a, cards: a.cards.map((c, j) => (j === i ? { ...c, ...patch } : c)) }));

  function save() {
    startTransition(async () => {
      try {
        const result = await saveAboutPage(about);
        if (result.success) {
          toast.success("Saved — the About page is updated.");
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
    if (!window.confirm("Switch the About page back to its built-in text?")) return;
    startTransition(async () => {
      try {
        const result = await resetPage("about");
        if (result.success) {
          setAbout(defaults);
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
    <div className="max-w-2xl space-y-8">
      <section className="space-y-4">
        <h3 className="font-semibold">Top of the page</h3>
        <Field label="Small badge">
          <Input value={about.badge} maxLength={300} onChange={(e) => set("badge", e.target.value)} />
        </Field>
        <Field label="Heading">
          <Input value={about.heading} maxLength={300} onChange={(e) => set("heading", e.target.value)} />
        </Field>
        <Field label="Intro paragraph">
          <Textarea value={about.intro} rows={4} maxLength={3000} onChange={(e) => set("intro", e.target.value)} />
        </Field>
      </section>

      <section className="space-y-4">
        <h3 className="font-semibold">The three cards</h3>
        {about.cards.map((card, i) => (
          <div key={i} className="space-y-3 rounded-lg border border-border/60 p-4">
            <Field label={`Card ${i + 1} title`}>
              <Input value={card.title} maxLength={300} onChange={(e) => setCard(i, { title: e.target.value })} />
            </Field>
            <Field label={`Card ${i + 1} text`}>
              <Textarea value={card.text} rows={3} maxLength={3000} onChange={(e) => setCard(i, { text: e.target.value })} />
            </Field>
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <h3 className="font-semibold">Bottom call to action</h3>
        <Field label="Heading">
          <Input value={about.ctaHeading} maxLength={300} onChange={(e) => set("ctaHeading", e.target.value)} />
        </Field>
        <Field label="Text">
          <Textarea value={about.ctaText} rows={3} maxLength={3000} onChange={(e) => set("ctaText", e.target.value)} />
        </Field>
      </section>

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
          render={<a href="/about" target="_blank" rel="noopener noreferrer" />}
        >
          <ExternalLink className="mr-1.5 h-4 w-4" />
          View live page
        </Button>
        {dirty && <span className="text-xs text-muted-foreground">Unsaved changes</span>}
      </div>
    </div>
  );
}
