"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Search, ShieldCheck, ShieldMinus, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  promoteToDispatcher,
  removeDispatcherRole,
  type DispatcherCandidate,
} from "@/app/admin/actions";

export function DispatcherManager({
  dispatchers,
  candidates,
}: {
  dispatchers: DispatcherCandidate[];
  candidates: DispatcherCandidate[];
}) {
  // Managed as local state and updated optimistically on success, rather
  // than relying on the server action's revalidatePath to re-render this
  // already-mounted client component — same pattern as OrderStatusSelect.
  const [dispatcherList, setDispatcherList] = useState(dispatchers);
  const [candidateList, setCandidateList] = useState(candidates);
  const [query, setQuery] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<DispatcherCandidate | null>(null);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return candidateList
      .filter((u) => u.name?.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
      .slice(0, 8);
  }, [query, candidateList]);

  async function handlePromote(user: DispatcherCandidate) {
    setPendingId(user.id);
    try {
      await promoteToDispatcher(user.id);
      setCandidateList((prev) => prev.filter((u) => u.id !== user.id));
      setDispatcherList((prev) =>
        [...prev, { ...user, role: "dispatcher" }].sort((a, b) => a.name.localeCompare(b.name))
      );
      setQuery("");
      toast.success(`${user.name} is now a dispatcher`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't promote this user");
    } finally {
      setPendingId(null);
    }
  }

  async function handleRemove() {
    if (!removeTarget) return;
    const user = removeTarget;
    setRemoveTarget(null);
    setPendingId(user.id);
    try {
      await removeDispatcherRole(user.id);
      setDispatcherList((prev) => prev.filter((u) => u.id !== user.id));
      setCandidateList((prev) =>
        [...prev, { ...user, role: "user" }].sort((a, b) => a.name.localeCompare(b.name))
      );
      toast.success(`Removed ${user.name}'s dispatcher access`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't remove dispatcher access");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="max-w-xl space-y-8">
      <div>
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
          Current dispatchers {dispatcherList.length > 0 && `(${dispatcherList.length})`}
        </h3>
        {dispatcherList.length === 0 ? (
          <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            No dispatchers yet, search for a user below to add one.
          </p>
        ) : (
          <ul className="space-y-2">
            {dispatcherList.map((u) => (
              <li
                key={u.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border/60 p-3"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
                  <div className="overflow-hidden">
                    <p className="truncate text-sm font-medium">{u.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pendingId === u.id}
                  onClick={() => setRemoveTarget(u)}
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Add a dispatcher</h3>
        <p className="mb-3 text-xs text-muted-foreground">
          They need an existing account first, search by name or email.
        </p>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users by name or email..."
            className="pl-9"
          />
        </div>
        {query.trim() && (
          <ul className="mt-2 space-y-2">
            {matches.length === 0 ? (
              <li className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                No matching users.
              </li>
            ) : (
              matches.map((u) => (
                <li
                  key={u.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border/60 p-3"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <UserCog className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="overflow-hidden">
                      <p className="truncate text-sm font-medium">{u.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </div>
                  <Button size="sm" disabled={pendingId === u.id} onClick={() => handlePromote(u)}>
                    Make dispatcher
                  </Button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>

      <Dialog open={!!removeTarget} onOpenChange={(open) => !open && setRemoveTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove dispatcher access?</DialogTitle>
            <DialogDescription>
              {`${removeTarget?.name} will lose access to the dispatcher tools immediately. Their account otherwise stays as-is, and they can be re-added later.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button variant="destructive" disabled={pendingId === removeTarget?.id} onClick={handleRemove}>
              <ShieldMinus className="h-4 w-4" />
              Remove access
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
