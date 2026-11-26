"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Check, Mail, MapPin, Phone, ShieldAlert, ShieldX, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
  approveDriverApplication,
  rejectDriverApplication,
  type DriverApplication,
} from "@/app/dispatcher/actions";

type ReviewAction = { application: DriverApplication; type: "approve" | "reject" };

const STATUS_TABS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
] as const;

export function DriverApplicationsList({
  applications: initialApplications,
}: {
  applications: DriverApplication[];
}) {
  const [applications, setApplications] = useState(initialApplications);
  const [tab, setTab] = useState<(typeof STATUS_TABS)[number]["value"]>("pending");
  const [action, setAction] = useState<ReviewAction | null>(null);
  const [note, setNote] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const byStatus: Record<string, DriverApplication[]> = { pending: [], approved: [], rejected: [] };
    for (const app of applications) {
      (byStatus[app.status] ??= []).push(app);
    }
    return byStatus;
  }, [applications]);

  function openAction(application: DriverApplication, type: "approve" | "reject") {
    setNote("");
    setAction({ application, type });
  }

  async function handleConfirm() {
    if (!action) return;
    const { application, type } = action;
    setAction(null);
    setPendingId(application.id);

    try {
      if (type === "approve") {
        await approveDriverApplication(application.id, note);
      } else {
        await rejectDriverApplication(application.id, note);
      }
      setApplications((prev) =>
        prev.map((a) =>
          a.id === application.id
            ? {
                ...a,
                status: type === "approve" ? "approved" : "rejected",
                reviewedAt: new Date(),
                reviewNote: note.trim() || null,
              }
            : a
        )
      );
      toast.success(type === "approve" ? `${application.fullName} approved` : `${application.fullName} rejected`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't update this application");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div>
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
                No {t.label.toLowerCase()} applications.
              </p>
            ) : (
              <ul className="space-y-3">
                {grouped[t.value].map((app) => (
                  <li key={app.id} className="rounded-lg border border-border/60 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{app.fullName}</p>
                          <Badge variant="outline">{app.vehicleType}</Badge>
                          {app.blacklistedAt ? (
                            <span className="flex items-center gap-1 text-xs font-medium text-destructive">
                              <ShieldX className="h-3.5 w-3.5" />
                              Blacklisted
                            </span>
                          ) : (
                            app.flagCount > 0 && (
                              <span className="flex items-center gap-1 text-xs font-medium text-amber-600">
                                <ShieldAlert className="h-3.5 w-3.5" />
                                {app.flagCount} flag{app.flagCount === 1 ? "" : "s"}
                              </span>
                            )
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Phone className="h-3.5 w-3.5" />
                            <a href={`tel:${app.phone}`} className="hover:underline">
                              {app.phone}
                            </a>
                          </span>
                          {app.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3.5 w-3.5" />
                              <a href={`mailto:${app.email}`} className="hover:underline">
                                {app.email}
                              </a>
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {app.city}
                          </span>
                        </div>
                        {app.notes && (
                          <p className="mt-2 text-sm text-muted-foreground italic">
                            &ldquo;{app.notes}&rdquo;
                          </p>
                        )}
                        <p className="mt-2 text-xs text-muted-foreground">
                          Applied {new Date(app.createdAt).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                          {app.reviewedAt &&
                            ` · Reviewed ${new Date(app.reviewedAt).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}`}
                        </p>
                        {app.reviewNote && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Note: <span className="italic">{app.reviewNote}</span>
                          </p>
                        )}
                      </div>

                      {t.value === "pending" && (
                        <div className="flex shrink-0 gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={pendingId === app.id}
                            onClick={() => openAction(app, "reject")}
                          >
                            <X className="h-4 w-4" />
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            disabled={pendingId === app.id}
                            onClick={() => openAction(app, "approve")}
                          >
                            <Check className="h-4 w-4" />
                            Approve
                          </Button>
                        </div>
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
              {action?.type === "approve" ? "Approve" : "Reject"} {action?.application.fullName}?
            </DialogTitle>
            <DialogDescription>
              {action?.type === "approve"
                ? "They'll get an email letting them know they're approved to drive."
                : action?.application.email
                  ? "They'll get a generic email letting them know they weren't approved."
                  : "They didn't leave an email, so nothing gets sent automatically."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="review-note">Internal note (optional)</Label>
            <Textarea
              id="review-note"
              rows={2}
              placeholder="Not shown to the applicant, for your own reference."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button
              variant={action?.type === "reject" ? "destructive" : "default"}
              onClick={handleConfirm}
            >
              {action?.type === "approve" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
