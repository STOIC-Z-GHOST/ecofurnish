"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Navigation, PackageCheck, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  submitStartedDriving,
  submitNearDestination,
  submitDelivered,
} from "@/app/actions/driver-portal";
import type { ClaimType } from "@/lib/driver-portal";

function getLocation(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Your browser doesn't support location, try a different browser."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          reject(new Error("Location access is needed for this step, please allow it and try again."));
        } else {
          reject(new Error("Couldn't get your location, check your GPS and try again."));
        }
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  });
}

export function DriverActionPanel({
  token,
  expectedType,
  alreadyPending,
  lastDeclinedNote,
}: {
  token: string;
  expectedType: ClaimType | null;
  alreadyPending: boolean;
  lastDeclinedNote: string | null;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [pin, setPin] = useState("");
  const [pending, setPending] = useState(alreadyPending);

  if (!expectedType) {
    return (
      <p className="rounded-lg border border-border/60 p-4 text-center text-muted-foreground">
        Nothing to do right now, check back once the order&apos;s ready.
      </p>
    );
  }

  if (pending) {
    return (
      <p className="rounded-lg border border-border/60 bg-muted/20 p-4 text-center text-muted-foreground">
        Submitted, waiting for dispatcher review.
      </p>
    );
  }

  async function handleStartedDriving() {
    setSubmitting(true);
    const result = await submitStartedDriving(token);
    setSubmitting(false);
    if (result.success) {
      setPending(true);
      toast.success("Marked as on the way");
    } else {
      toast.error(result.error);
    }
  }

  async function handleNearDestination() {
    setSubmitting(true);
    try {
      const { lat, lng } = await getLocation();
      const result = await submitNearDestination(token, lat, lng);
      if (result.success) {
        setPending(true);
        toast.success("Marked as near the destination");
      } else {
        toast.error(result.error);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelivered() {
    if (pin.trim().length !== 6) {
      toast.error("Enter the 6-digit PIN the customer gives you.");
      return;
    }
    setSubmitting(true);
    try {
      const { lat, lng } = await getLocation();
      const result = await submitDelivered(token, lat, lng, pin.trim());
      if (result.success) {
        setPending(true);
        toast.success("Delivery marked complete");
      } else {
        toast.error(result.error);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-3">
      {lastDeclinedNote && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          Your last update wasn&apos;t confirmed: {lastDeclinedNote}
        </p>
      )}

      {expectedType === "started_driving" && (
        <Button className="w-full" size="lg" disabled={submitting} onClick={handleStartedDriving}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}
          I&apos;ve started driving
        </Button>
      )}

      {expectedType === "near_destination" && (
        <Button className="w-full" size="lg" disabled={submitting} onClick={handleNearDestination}>
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Navigation className="h-4 w-4" />
          )}
          I&apos;m near the destination
        </Button>
      )}

      {expectedType === "delivered" && (
        <div className="space-y-2">
          <Label htmlFor="pin">PIN from the customer</Label>
          <Input
            id="pin"
            inputMode="numeric"
            maxLength={6}
            placeholder="6-digit code"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          />
          <Button className="w-full" size="lg" disabled={submitting} onClick={handleDelivered}>
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <PackageCheck className="h-4 w-4" />
            )}
            Mark as delivered
          </Button>
        </div>
      )}
    </div>
  );
}
