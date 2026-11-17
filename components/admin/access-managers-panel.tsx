"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addAccessManager, removeAccessManager } from "@/app/admin/guests/actions";

export type ManagerRow = {
  email: string;
  maxDays: number;
  maxActive: number;
  activeGuests: number;
  revoked: boolean;
};

const DAY_OPTIONS = [1, 3, 7, 14, 30];

/** Owner only: who may invite guests, and how far their permission goes. */
export function AccessManagersPanel({
  managers,
  setupNeeded,
}: {
  managers: ManagerRow[];
  setupNeeded: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [maxDays, setMaxDays] = useState(7);
  const [maxActive, setMaxActive] = useState(5);

  function run(task: () => Promise<{ success: boolean; error?: string }>, ok: string) {
    startTransition(async () => {
      try {
        const result = await task();
        if (result.success) {
          toast.success(ok);
          router.refresh();
        } else {
          toast.error(result.error ?? "Something went wrong.");
        }
      } catch {
        toast.error("Something went wrong.");
      }
    });
  }

  return (
    <div className="rounded-lg border border-border/60 p-5">
      <h2 className="font-semibold">Access managers</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Someone you trust to invite read-only guests <em>for you</em>. They can only use this Guests
        page — they can&apos;t see orders, change anything, or make other managers. You pick how long
        each guest may stay and how many can be active at once, and you&apos;re messaged on Telegram
        for every invite.
      </p>

      {setupNeeded ? (
        <p className="mt-4 rounded-lg border border-border/60 bg-muted/20 p-3 text-sm text-muted-foreground">
          The <code>admin_delegates</code> table isn&apos;t in the database yet. Run{" "}
          <code>batch-c-run-in-neon-first.sql</code> in the Neon SQL editor, then reload.
        </p>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <div className="min-w-[220px] flex-1">
              <label className="mb-1 block text-xs text-muted-foreground" htmlFor="mgr-email">
                Their email address
              </label>
              <Input
                id="mgr-email"
                type="email"
                placeholder="friend@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground" htmlFor="mgr-days">
                Longest guest stay
              </label>
              <select
                id="mgr-days"
                value={maxDays}
                onChange={(e) => setMaxDays(Number(e.target.value))}
                className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm"
              >
                {DAY_OPTIONS.map((d) => (
                  <option key={d} value={d}>
                    {d} day{d > 1 ? "s" : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground" htmlFor="mgr-active">
                Guests at once
              </label>
              <Input
                id="mgr-active"
                type="number"
                min={1}
                max={50}
                className="w-24"
                value={maxActive}
                onChange={(e) => setMaxActive(Number(e.target.value))}
              />
            </div>
            <Button
              disabled={pending || email.trim() === ""}
              onClick={() =>
                run(async () => {
                  const result = await addAccessManager(email, maxDays, maxActive);
                  if (result.success) setEmail("");
                  return result;
                }, "Saved — they've been emailed.")
              }
            >
              Save manager
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Saving an address that&apos;s already listed updates their limits.
          </p>

          {managers.length > 0 && (
            <div className="mt-4 overflow-x-auto rounded-lg border border-border/60">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-left text-muted-foreground">
                  <tr>
                    <th className="p-3">Manager</th>
                    <th className="p-3">Limits</th>
                    <th className="p-3">Guests now</th>
                    <th className="p-3" />
                  </tr>
                </thead>
                <tbody>
                  {managers.map((m) => (
                    <tr key={m.email} className="border-t border-border/60">
                      <td className="p-3">
                        {m.email}{" "}
                        {m.revoked && <Badge variant="outline">removed</Badge>}
                      </td>
                      <td className="p-3 text-muted-foreground">
                        up to {m.maxDays} day{m.maxDays > 1 ? "s" : ""} · {m.maxActive} at once
                      </td>
                      <td className="p-3">{m.activeGuests}</td>
                      <td className="p-3 text-right">
                        {!m.revoked && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={pending}
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Remove ${m.email}? Every guest they invited loses access too.`
                                )
                              ) {
                                run(() => removeAccessManager(m.email), "Removed — their guests are cut off.");
                              }
                            }}
                          >
                            Remove
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
