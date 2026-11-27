"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { saveSiteSettings } from "@/app/admin/settings/actions";

interface Def {
  key: string;
  group: string;
  label: string;
  description: string;
}

export default function SettingsForm({
  defs,
  initial,
}: {
  defs: Def[];
  initial: Record<string, boolean>;
}) {
  const [values, setValues] = useState<Record<string, boolean>>(initial);
  const [saved, setSaved] = useState<Record<string, boolean>>(initial);
  const [pending, startTransition] = useTransition();
  const dirty = defs.some((d) => values[d.key] !== saved[d.key]);

  const groups = Array.from(new Set(defs.map((d) => d.group)));

  function save() {
    startTransition(async () => {
      const result = await saveSiteSettings(values);
      if (result.success) {
        setSaved(values);
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
                return (
                  <div key={d.key} className="flex items-start justify-between gap-4 p-4">
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
                );
              })}
          </div>
        </section>
      ))}

      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={!dirty || pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
        {dirty && !pending && <span className="text-sm text-muted-foreground">Unsaved changes</span>}
      </div>
    </div>
  );
}
