"use client";

import { Button } from "@/components/ui/button";
import { countSandboxChanges, resetSandbox, useSandbox } from "@/lib/sandbox-store";

/** The yellow strip a read-only guest sees on every admin page. */
export function SandboxBanner({ expiresAtIso }: { expiresAtIso: string | null }) {
  const changes = countSandboxChanges(useSandbox());
  const ends = expiresAtIso
    ? new Date(expiresAtIso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
    : null;

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
      <p>
        <strong>Guest view.</strong> Customer details are masked. Go ahead and try changing things, your edits are saved <strong>only in this browser</strong> and never touch the real store.
        {ends && <> Your access ends {ends}.</>}
      </p>
      {changes > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (window.confirm("Undo all the changes you've made in this sandbox?")) resetSandbox();
          }}
        >
          Reset my changes ({changes})
        </Button>
      )}
    </div>
  );
}
