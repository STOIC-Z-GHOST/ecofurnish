"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, MapPin, Navigation, PackageCheck, ShieldAlert, Truck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { approveClaim, declineClaim, type PendingClaim } from "@/app/dispatcher/actions";

type ReviewAction = { claim: PendingClaim; type: "approve" | "decline" };

const CLAIM_LABELS: Record<string, { label: string; icon: typeof Truck }> = {
  started_driving: { label: "Started Driving", icon: Truck },
  near_destination: { label: "Near Destination", icon: Navigation },
  delivered: { label: "Delivered", icon: PackageCheck },
};

function formatDistance(meters: string | null) {
  if (meters === null) return null;
  const m = parseFloat(meters);
  return m < 1000 ? `${Math.round(m)} m away` : `${(m / 1000).toFixed(1)} km away`;
}

export function DeliveryClaimsQueue({ claims: initialClaims }: { claims: PendingClaim[] }) {
  const [claims, setClaims] = useState(initialClaims);
  const [action, setAction] = useState<ReviewAction | null>(null);
  const [note, setNote] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);

  function openAction(claim: PendingClaim, type: "approve" | "decline") {
    setNote("");
    setAction({ claim, type });
  }

  async function handleConfirm() {
    if (!action) return;
    const { claim, type } = action;
    setAction(null);
    setPendingId(claim.claimId);

    try {
      if (type === "approve") {
        await approveClaim(claim.claimId, note);
      } else {
        await declineClaim(claim.claimId, note);
      }
      setClaims((prev) => prev.filter((c) => c.claimId !== claim.claimId));
      toast.success(
        type === "approve"
          ? `Approved, order #${claim.orderId.slice(0, 8)} moved forward`
          : `Declined, ${claim.driverName} was flagged`
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't update this claim");
    } finally {
      setPendingId(null);
    }
  }

  if (claims.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        No pending claims, nothing waiting for review.
      </p>
    );
  }

  return (
    <div>
      <ul className="space-y-3">
        {claims.map((claim) => {
          const meta = CLAIM_LABELS[claim.claimType] ?? { label: claim.claimType, icon: Truck };
          const Icon = meta.icon;
          const distance = formatDistance(claim.distanceMeters);
          const distanceFar = claim.distanceMeters !== null && parseFloat(claim.distanceMeters) > 1000;

          return (
            <li key={claim.claimId} className="rounded-lg border border-border/60 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-primary" />
                    <p className="font-medium">{meta.label}</p>
                    <Badge variant="outline">#{claim.orderId.slice(0, 8)}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {claim.customerName} · driver {claim.driverName}
                    {claim.driverFlagCount > 0 && (
                      <span className="ml-2 inline-flex items-center gap-1 text-amber-600">
                        <ShieldAlert className="h-3.5 w-3.5" />
                        {claim.driverFlagCount} previous flag{claim.driverFlagCount === 1 ? "" : "s"}
                      </span>
                    )}
                  </p>

                  {distance && (
                    <p
                      className={`mt-1 flex items-center gap-1 text-sm ${
                        distanceFar ? "text-destructive" : "text-muted-foreground"
                      }`}
                    >
                      <MapPin className="h-3.5 w-3.5" />
                      {distance} from the delivery address
                    </p>
                  )}

                  {claim.claimType === "delivered" && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      PIN entered: <span className="font-mono">{claim.pinEntered}</span>{" "}
                      {claim.pinMatched && <span className="text-primary">✓ matched</span>}
                    </p>
                  )}

                  <p className="mt-2 text-xs text-muted-foreground">
                    Submitted{" "}
                    {new Date(claim.createdAt).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                <div className="flex shrink-0 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pendingId === claim.claimId}
                    onClick={() => openAction(claim, "decline")}
                  >
                    <X className="h-4 w-4" />
                    Decline
                  </Button>
                  <Button
                    size="sm"
                    disabled={pendingId === claim.claimId}
                    onClick={() => openAction(claim, "approve")}
                  >
                    <Check className="h-4 w-4" />
                    Approve
                  </Button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <Dialog open={!!action} onOpenChange={(open) => !open && setAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action?.type === "approve" ? "Approve" : "Decline"} this claim?
            </DialogTitle>
            <DialogDescription>
              {action?.type === "approve"
                ? "The order moves to the next stage and the customer gets notified."
                : `The driver gets flagged and can see this note on their portal. ${
                    action && action.claim.driverFlagCount === 2
                      ? "This will be their 3rd flag, they'll be auto-blacklisted."
                      : ""
                  }`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="claim-note">
              Note {action?.type === "decline" ? "(shown to the driver)" : "(internal, optional)"}
            </Label>
            <Textarea
              id="claim-note"
              rows={2}
              placeholder={
                action?.type === "decline"
                  ? "e.g. You're too far from the address, try again once you arrive."
                  : "Not shown to anyone, for your own reference."
              }
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button
              variant={action?.type === "decline" ? "destructive" : "default"}
              onClick={handleConfirm}
            >
              {action?.type === "approve" ? "Approve" : "Decline"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
