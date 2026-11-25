"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { Copy, Loader2, MapPin, Truck, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { formatPrice } from "@/lib/currency";
import { driverPortalUrl } from "@/lib/delivery";
import {
  assignDriverToOrder,
  geocodeOrderAddress,
  type AssignableOrder,
  type ApprovedDriver,
  type ActiveDelivery,
} from "@/app/dispatcher/actions";

const DeliveryMapPicker = dynamic(
  () => import("@/components/dispatcher/DeliveryMapPicker").then((m) => m.DeliveryMapPicker),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-64 items-center justify-center rounded-lg border border-border/60 text-sm text-muted-foreground">
        Loading map…
      </div>
    ),
  }
);

// Central Addis Ababa — used as the starting pin when geocoding the
// order's address comes back empty, so there's always something on the
// map for the dispatcher to drag into place.
const FALLBACK_CENTER = { lat: 9.0192, lng: 38.7525 };

const ORDER_STATUS_LABELS: Record<string, string> = {
  ready_for_delivery: "Ready for Delivery",
  on_the_road: "On the Road",
  near_destination: "Near Destination",
  delivered: "Delivered",
};

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).then(
    () => toast.success("Link copied"),
    () => toast.error("Couldn't copy, copy it manually instead")
  );
}

export function DeliveryAssignmentPanel({
  orders: initialOrders,
  drivers: initialDrivers,
  activeDeliveries: initialActive,
}: {
  orders: AssignableOrder[];
  drivers: ApprovedDriver[];
  activeDeliveries: ActiveDelivery[];
}) {
  const [orders, setOrders] = useState(initialOrders);
  const [drivers, setDrivers] = useState(initialDrivers);
  const [activeDeliveries, setActiveDeliveries] = useState(initialActive);

  const [assignTarget, setAssignTarget] = useState<AssignableOrder | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [pin, setPin] = useState(FALLBACK_CENTER);
  const [pinSource, setPinSource] = useState<"gps" | "geocoded" | "fallback">("fallback");
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // Set once assignment succeeds — swaps the dialog into a "here's the
  // driver's link" view instead of just closing, since email is
  // optional for drivers (phone is required) and this may be the only
  // way the dispatcher can actually hand it over.
  const [successLink, setSuccessLink] = useState<{ driverName: string; url: string } | null>(null);

  async function openAssignDialog(order: AssignableOrder) {
    setAssignTarget(order);
    setSelectedDriverId("");
    setPin(FALLBACK_CENTER);
    setPinSource("fallback");
    setGeoLoading(true);
    try {
      const result = await geocodeOrderAddress(order.id);
      if (result) {
        setPin({ lat: result.lat, lng: result.lng });
        setPinSource(result.source);
      } else {
        setPin(FALLBACK_CENTER);
        setPinSource("fallback");
      }
    } catch {
      setPin(FALLBACK_CENTER);
      setPinSource("fallback");
    } finally {
      setGeoLoading(false);
    }
  }

  async function handleAssign() {
    if (!assignTarget || !selectedDriverId) return;
    const order = assignTarget;
    const driver = drivers.find((d) => d.id === selectedDriverId);
    if (!driver) return;

    setSubmitting(true);
    try {
      const result = await assignDriverToOrder({
        orderId: order.id,
        driverId: driver.id,
        lat: pin.lat,
        lng: pin.lng,
      });

      setOrders((prev) => prev.filter((o) => o.id !== order.id));
      setDrivers((prev) => prev.filter((d) => d.id !== driver.id));
      setActiveDeliveries((prev) => [
        {
          assignmentId: crypto.randomUUID(),
          orderId: order.id,
          customerName: order.customerName,
          driverName: driver.fullName,
          orderStatus: "ready_for_delivery",
          assignedAt: new Date(),
          magicToken: result.magicToken,
        },
        ...prev,
      ]);
      setSuccessLink({ driverName: driver.fullName, url: result.portalUrl });
      toast.success(`${driver.fullName} assigned to order #${order.id.slice(0, 8)}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't assign this driver");
    } finally {
      setSubmitting(false);
    }
  }

  function closeDialog() {
    setAssignTarget(null);
    setSuccessLink(null);
  }

  return (
    <div className="space-y-10">
      <div>
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
          Ready to assign {orders.length > 0 && `(${orders.length})`}
        </h3>
        {orders.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            No orders waiting for a driver right now.
          </p>
        ) : (
          <ul className="space-y-3">
            {orders.map((order) => (
              <li
                key={order.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 p-4"
              >
                <div>
                  <p className="font-mono text-sm text-muted-foreground">#{order.id.slice(0, 8)}</p>
                  <p className="font-medium">{order.customerName}</p>
                  <p className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    {order.shippingAddress}, {order.city}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-primary">
                    {formatPrice(order.totalAmount, "ETB")}
                  </span>
                  <Button
                    size="sm"
                    disabled={drivers.length === 0}
                    onClick={() => openAssignDialog(order)}
                  >
                    <Truck className="h-4 w-4" />
                    Assign Driver
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {orders.length > 0 && drivers.length === 0 && (
          <p className="mt-2 text-xs text-muted-foreground">
            No approved drivers available right now, everyone&apos;s either mid-delivery or
            there are no approved applications yet.
          </p>
        )}
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
          Active deliveries {activeDeliveries.length > 0 && `(${activeDeliveries.length})`}
        </h3>
        {activeDeliveries.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            No deliveries in progress.
          </p>
        ) : (
          <ul className="space-y-2">
            {activeDeliveries.map((d) => (
              <li
                key={d.assignmentId}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 p-3"
              >
                <div>
                  <p className="font-mono text-xs text-muted-foreground">
                    #{d.orderId.slice(0, 8)}
                  </p>
                  <p className="text-sm font-medium">{d.customerName}</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-3.5 w-3.5" />
                  {d.driverName}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {ORDER_STATUS_LABELS[d.orderStatus] ?? d.orderStatus}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(driverPortalUrl(d.magicToken))}
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copy Link
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Dialog open={!!assignTarget} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="sm:max-w-lg">
          {successLink ? (
            <>
              <DialogHeader>
                <DialogTitle>Driver assigned</DialogTitle>
                <DialogDescription>
                  {`${successLink.driverName} was notified by email if they gave one. Here's their link either way, in case you need to send it yourself.`}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2 rounded-lg border border-border/60 p-3">
                <code className="block break-all text-xs text-muted-foreground">
                  {successLink.url}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => copyToClipboard(successLink.url)}
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy Link
                </Button>
              </div>
              <DialogFooter>
                <Button onClick={closeDialog}>Done</Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Assign a driver</DialogTitle>
                <DialogDescription>
                  {assignTarget && (
                    <>
                      Order #{assignTarget.id.slice(0, 8)} - {assignTarget.shippingAddress},{" "}
                      {assignTarget.city}
                    </>
                  )}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <Select value={selectedDriverId} onValueChange={(v) => v && setSelectedDriverId(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a driver" />
                  </SelectTrigger>
                  <SelectContent>
                    {drivers.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.fullName} · {d.vehicleType}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {geoLoading ? (
                  <div className="flex h-64 items-center justify-center rounded-lg border border-border/60 text-sm text-muted-foreground">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Locating address…
                  </div>
                ) : (
                  <>
                    <DeliveryMapPicker
                      lat={pin.lat}
                      lng={pin.lng}
                      onChange={(lat, lng) => setPin({ lat, lng })}
                    />
                    <p className="text-xs text-muted-foreground">
                      {`Drag the pin (or click the map) to correct it, this starting point ${
                        pinSource === "gps"
                          ? "came from the buyer's own device location"
                          : pinSource === "geocoded"
                            ? "comes from an automatic address lookup, which isn't always exact"
                            : "is just a rough city center, the address lookup didn't find a match"
                      }. `}
                      {pin.lat.toFixed(6)}, {pin.lng.toFixed(6)}
                    </p>
                  </>
                )}
              </div>

              <DialogFooter>
                <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
                <Button
                  disabled={!selectedDriverId || geoLoading || submitting}
                  onClick={handleAssign}
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Confirm Assignment
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
