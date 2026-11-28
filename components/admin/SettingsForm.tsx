"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveSiteSettings } from "@/app/admin/settings/actions";

interface Def {
  key: string;
  group: string;
  label: string;
  description: string;
}

interface TextDef {
  key: string;
  forSwitch: string;
  label: string;
  placeholder: string;
  max: number;
}

export default function SettingsForm({
  defs,
  texts,
  initial,
  initialTexts,
  demo = false,
  guestLink,
}: {
  defs: Def[];
  texts: TextDef[];
  initial: Record<string, boolean>;
  initialTexts: Record<string, string>;
  /** A guest's view: Save only pretends, nothing is sent to the server. */
  demo?: boolean;
  /** Shows a card that opens the Guest settings page, e.g. { count: 3, total: 10 }. */
  guestLink?: { count: number; total: number };
}) {
  const [values, setValues] = useState<Record<string, boolean>>(initial);
  const [textValues, setTextValues] = useState<Record<string, string>>(initialTexts);
  const [saved, setSaved] = useState({ values: initial, texts: initialTexts });
  const [pending, startTransition] = useTransition();
  const dirty =
    defs.some((d) => values[d.key] !== saved.values[d.key]) ||
    texts.some((t) => (textValues[t.key] ?? "") !== (saved.texts[t.key] ?? ""));

  const groups = Array.from(new Set(defs.map((d) => d.group)));

  function save() {
    if (demo) {
      setSaved({ values, texts: textValues });
      toast.success("Saved on this screen only. The real site is unchanged.");
      return;
    }
    startTransition(async () => {
      const result = await saveSiteSettings(values, textValues);
      if (result.success) {
        setSaved({ values, texts: textValues });
        toast.success("Settings saved");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="max-w-2xl space-y-8">
      {groups.map((group) => (
        <section key={group}>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {group}
          </h3>
          <div className="divide-y divide-border/60 rounded-lg border border-border/60">
            {defs
              .filter((d) => d.group === group)
              .map((d) => {
                const on = values[d.key];
                const extra = texts.filter((t) => t.forSwitch === d.key);
                return (
                  <div key={d.key} className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium">{d.label}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{d.description}</p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={on}
                        aria-label={d.label}
                        onClick={() => setValues((v) => ({ ...v, [d.key]: !on }))}
                        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors ${
                          on ? "bg-emerald-700" : "bg-muted-foreground/30"
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform ${
                            on ? "translate-x-5" : ""
                          }`}
                        />
                      </button>
                    </div>
                    {extra.map((t) => (
                      <div key={t.key} className="mt-3">
                        <label htmlFor={t.key} className="mb-1 block text-xs font-medium text-muted-foreground">
                          {t.label}
                        </label>
                        <Input
                          id={t.key}
                          value={textValues[t.key] ?? ""}
                          maxLength={t.max}
                          placeholder={t.placeholder}
                          onChange={(e) => setTextValues((v) => ({ ...v, [t.key]: e.target.value }))}
                        />
                      </div>
                    ))}
                  </div>
                );
              })}
          </div>
        </section>
      ))}

      {guestLink && (
        <Link
          href="/admin/settings/guests"
          className="flex items-center justify-between gap-4 rounded-lg border border-border/60 p-4 transition-colors hover:bg-muted/40"
        >
          <span>
            <span className="block text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Guest settings
            </span>
            <span className="mt-1 block text-sm text-muted-foreground">
              Choose which admin pages a temporary read-only guest can open. {guestLink.count} of{" "}
              {guestLink.total} on.
            </span>
          </span>
          <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
        </Link>
      )}

      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={!dirty || pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
        {dirty && !pending && <span className="text-sm text-muted-foreground">Unsaved changes</span>}
      </div>
    </div>
  );
}
