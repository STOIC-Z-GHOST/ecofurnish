"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Check, MessageCircle, Plus, ShieldX, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
  approveTelegramRequest,
  rejectTelegramRequest,
  removeTelegramAdmin,
  addTelegramAdminManually,
  type TelegramAdminRow,
} from "@/app/admin/telegram/actions";

type Action = { row: TelegramAdminRow; type: "approve" | "reject" | "remove" };

const STATUS_TABS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
] as const;

export function TelegramAdminsList({ admins: initialAdmins }: { admins: TelegramAdminRow[] }) {
  const [admins, setAdmins] = useState(initialAdmins);
  const [tab, setTab] = useState<(typeof STATUS_TABS)[number]["value"]>("pending");
  const [action, setAction] = useState<Action | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const [newChatId, setNewChatId] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [adding, setAdding] = useState(false);

  const grouped = useMemo(() => {
    const byStatus: Record<string, TelegramAdminRow[]> = { pending: [], approved: [], rejected: [] };
    for (const row of admins) {
      // "awaiting_reason" rows (tapped the button, haven't typed a
      // reason yet) aren't shown anywhere — nothing for an admin to act
      // on until a reason actually comes in.
      if (row.status in byStatus) byStatus[row.status].push(row);
    }
    return byStatus;
  }, [admins]);

  async function handleConfirm() {
    if (!action) return;
    const { row, type } = action;
    setAction(null);
    setPendingId(row.id);

    try {
      if (type === "approve") await approveTelegramRequest(row.id);
      else if (type === "reject") await rejectTelegramRequest(row.id);
      else await removeTelegramAdmin(row.id);

      setAdmins((prev) =>
        prev.map((a) =>
          a.id === row.id
            ? { ...a, status: type === "approve" ? "approved" : "rejected", reviewedAt: new Date() }
            : a
        )
      );
      toast.success(
        type === "approve" ? "Approved" : type === "reject" ? "Rejected" : "Access removed"
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't update this");
    } finally {
      setPendingId(null);
    }
  }

  async function handleAddManually() {
    if (!newChatId.trim()) {
      toast.error("Enter a chat ID first.");
      return;
    }
    setAdding(true);
    try {
      await addTelegramAdminManually(newChatId, newLabel);
      setAdmins((prev) => [
        {
          id: crypto.randomUUID(),
          chatId: newChatId.trim(),
          label: newLabel.trim() || null,
          reason: null,
          status: "approved",
          requestedAt: new Date(),
          reviewedAt: new Date(),
        },
        ...prev,
      ]);
      setNewChatId("");
      setNewLabel("");
      toast.success("Added");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't add this chat ID");
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Add manually</h3>
        <p className="mb-3 text-xs text-muted-foreground">
          Already have a chat ID from somewhere else? Skip the request flow entirely.
        </p>
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1.5">
            <Label htmlFor="new-chat-id">Chat ID</Label>
            <Input
              id="new-chat-id"
              value={newChatId}
              onChange={(e) => setNewChatId(e.target.value)}
              placeholder="123456789"
              className="w-40"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-label">Label (optional)</Label>
            <Input
              id="new-label"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="e.g. Abebe, dispatcher"
              className="w-56"
            />
          </div>
          <Button disabled={adding} onClick={handleAddManually}>
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => v && setTab(v as typeof tab)}>
        <TabsList>
          {STATUS_TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label} ({grouped[t.value]?.length ?? 0})
            </TabsTrigger>
          ))}
        </TabsList>

        {STATUS_TABS.map((t) => (
          <TabsContent key={t.value} value={t.value} className="mt-4">
            {(grouped[t.value]?.length ?? 0) === 0 ? (
              <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                No {t.label.toLowerCase()} entries.
              </p>
            ) : (
              <ul className="space-y-3">
                {grouped[t.value].map((row) => (
                  <li key={row.id} className="rounded-lg border border-border/60 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <MessageCircle className="h-4 w-4 text-muted-foreground" />
                          <p className="font-mono text-sm font-medium">{row.chatId}</p>
                          {row.label && <span className="text-sm text-muted-foreground">{row.label}</span>}
                        </div>
                        {row.reason && (
                          <p className="mt-2 text-sm text-muted-foreground italic">
                            &ldquo;{row.reason}&rdquo;
                          </p>
                        )}
                        <p className="mt-2 text-xs text-muted-foreground">
                          Requested{" "}
                          {new Date(row.requestedAt).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>

                      {t.value === "pending" && (
                        <div className="flex shrink-0 gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={pendingId === row.id}
                            onClick={() => setAction({ row, type: "reject" })}
                          >
                            <X className="h-4 w-4" />
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            disabled={pendingId === row.id}
                            onClick={() => setAction({ row, type: "approve" })}
                          >
                            <Check className="h-4 w-4" />
                            Approve
                          </Button>
                        </div>
                      )}
                      {t.value === "approved" && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={pendingId === row.id}
                          onClick={() => setAction({ row, type: "remove" })}
                        >
                          <ShieldX className="h-4 w-4" />
                          Remove
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={!!action} onOpenChange={(open) => !open && setAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action?.type === "approve"
                ? "Approve this request?"
                : action?.type === "reject"
                  ? "Reject this request?"
                  : "Remove this admin's access?"}
            </DialogTitle>
            <DialogDescription>
              {action?.type === "approve" &&
                "They'll be notified on Telegram and can start using the bot right away."}
              {action?.type === "reject" &&
                "They'll be notified on Telegram that their request wasn't approved."}
              {action?.type === "remove" &&
                "They'll be notified on Telegram, and immediately lose access to bot commands."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button
              variant={action?.type === "approve" ? "default" : "destructive"}
              onClick={handleConfirm}
            >
              {action?.type === "approve" ? "Approve" : action?.type === "reject" ? "Reject" : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
