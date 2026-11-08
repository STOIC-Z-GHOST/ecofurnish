"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  deleteGuestAccess,
  grantGuestAccess,
  revokeGuestAccess,
} from "@/app/admin/guests/actions";

export type GuestRow = {
  email: string;
  expiresAt: string; // ISO
  revoked: boolean;
  active: boolean;
};

const DURATIONS = [
  { days: 1, label: "1 day" },
  { days: 3, label: "3 days" },
  { days: 7, label: "7 days" },
  { days: 14, label: "14 days" },
  { days: 30, label: "30 days" },
];

export function GuestAccessManager({ guests }: { guests: GuestRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [days, setDays] = useState(7);

  function run(task: () => Promise<{ success: boolean; error?: string }>, okMessage: string) {
    startTransition(async () => {
      try {
        const result = await task();
        if (result.success) {
          toast.success(okMessage);
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
    <div className="space-y-8">
      <div className="rounded-lg border border-border/60 p-5">
        <h2 className="font-semibold">Give read-only access</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          They can look at the dashboard, products and orders. Customer names and emails are masked,
          and they can&apos;t change anything. Access ends by itself.
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div className="min-w-[240px] flex-1">
            <label className="mb-1 block text-xs text-muted-foreground" htmlFor="guest-email">
              Email address
            </label>
            <Input
              id="guest-email"
              type="email"
              placeholder="someone@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground" htmlFor="guest-days">
              For
            </label>
            <select
              id="guest-days"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm"
            >
              {DURATIONS.map((d) => (
                <option key={d.days} value={d.days}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
          <Button
            disabled={pending || email.trim() === ""}
            onClick={() =>
              run(async () => {
                const result = await grantGuestAccess(email, days);
                if (result.success) setEmail("");
                return result;
              }, "Access granted — they've been emailed.")
            }
          >
            Grant access
          </Button>
        </div>
      </div>

      <div>
        <h2 className="mb-3 font-semibold">Guests ({guests.length})</h2>
        {guests.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nobody has guest access yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border/60">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-muted-foreground">
                <tr>
                  <th className="p-3">Email</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Access ends</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody>
                {guests.map((g) => (
                  <tr key={g.email} className="border-t border-border/60">
                    <td className="p-3">{g.email}</td>
                    <td className="p-3">
                      <Badge variant={g.active ? "default" : "outline"}>
                        {g.revoked ? "revoked" : g.active ? "active" : "expired"}
                      </Badge>
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {new Date(g.expiresAt).toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-2">
                        {g.active && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={pending}
                            onClick={() =>
                              run(() => revokeGuestAccess(g.email), "Access revoked.")
                            }
                          >
                            Revoke now
                          </Button>
                        )}
                        {!g.active && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={pending}
                            onClick={() => run(() => deleteGuestAccess(g.email), "Removed.")}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
