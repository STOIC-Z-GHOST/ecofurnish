"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Send, Users, Megaphone, User, Search, AtSign, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { sendBroadcastEmail, type BroadcastAudience } from "@/app/actions/broadcast";

interface Customer {
  email: string;
  name: string;
}

export function BroadcastForm({
  counts,
  customers,
}: {
  counts: {
    allCustomers: number;
    subscribers: number;
    driversWithEmail: number;
    driversTotal: number;
  };
  customers: Customer[];
}) {
  const [audience, setAudience] = useState<BroadcastAudience>("subscribers");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [customerQuery, setCustomerQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customAddress, setCustomAddress] = useState("");

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customAddress.trim());

  const recipientCount =
    audience === "subscribers"
      ? counts.subscribers
      : audience === "drivers"
        ? counts.driversWithEmail
        : audience === "single-customer"
          ? selectedCustomer
            ? 1
            : 0
          : audience === "custom-address"
            ? isValidEmail
              ? 1
              : 0
            : counts.allCustomers;

  const matchingCustomers = useMemo(() => {
    const q = customerQuery.trim().toLowerCase();
    if (!q) return [];
    return customers
      .filter((c) => c.name?.toLowerCase().includes(q) || c.email.toLowerCase().includes(q))
      .slice(0, 8);
  }, [customerQuery, customers]);

  const ready =
    subject.trim().length > 0 &&
    body.trim().length > 0 &&
    (audience !== "single-customer" || !!selectedCustomer) &&
    (audience !== "custom-address" || isValidEmail);

  async function sendTest() {
    if (!ready) return;
    setSending(true);
    try {
      const result = await sendBroadcastEmail({ subject, body, audience: "test" });
      if (result.success) toast.success("Test sent to your own email");
      else toast.error(result.error ?? "Test send failed");
    } finally {
      setSending(false);
    }
  }

  async function sendReal() {
    setConfirmOpen(false);
    setSending(true);
    try {
      const result = await sendBroadcastEmail({
        subject,
        body,
        audience,
        recipientEmail:
          audience === "custom-address" ? customAddress.trim() : selectedCustomer?.email,
      });
      if (result.success) {
        toast.success(`Sent to ${result.sent} recipient${result.sent === 1 ? "" : "s"}`);
        setSubject("");
        setBody("");
        setSelectedCustomer(null);
        setCustomerQuery("");
        setCustomAddress("");
      } else {
        toast.error(
          result.error ?? `${result.failed} of ${result.sent + (result.failed ?? 0)} failed to send`
        );
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <Label className="mb-2 block">Audience</Label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <button
            type="button"
            onClick={() => setAudience("subscribers")}
            className={`rounded-lg border p-4 text-left transition-colors ${
              audience === "subscribers"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/40"
            }`}
          >
            <div className="flex items-center gap-2 font-medium">
              <Megaphone className="h-4 w-4" />
              Newsletter subscribers
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {counts.subscribers} opted in, for regular updates, offers, new arrivals. Includes
              an unsubscribe link.
            </p>
          </button>
          <button
            type="button"
            onClick={() => setAudience("all-customers")}
            className={`rounded-lg border p-4 text-left transition-colors ${
              audience === "all-customers"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/40"
            }`}
          >
            <div className="flex items-center gap-2 font-medium">
              <Users className="h-4 w-4" />
              All customers
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {counts.allCustomers} accounts, reserve this for genuinely important, infrequent
              notices, not routine updates. No unsubscribe link, same as your order emails.
            </p>
          </button>
          <button
            type="button"
            onClick={() => setAudience("drivers")}
            className={`rounded-lg border p-4 text-left transition-colors ${
              audience === "drivers"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/40"
            }`}
          >
            <div className="flex items-center gap-2 font-medium">
              <Truck className="h-4 w-4" />
              Drivers
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {counts.driversWithEmail} of {counts.driversTotal} approved drivers have an email
              on file, phone is their required contact, so this won&apos;t reach everyone.
            </p>
          </button>
          <button
            type="button"
            onClick={() => setAudience("single-customer")}
            className={`rounded-lg border p-4 text-left transition-colors ${
              audience === "single-customer"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/40"
            }`}
          >
            <div className="flex items-center gap-2 font-medium">
              <User className="h-4 w-4" />
              One customer
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Pick a single account holder, for a one-off, personal message to just them.
            </p>
          </button>
          <button
            type="button"
            onClick={() => setAudience("custom-address")}
            className={`rounded-lg border p-4 text-left transition-colors ${
              audience === "custom-address"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/40"
            }`}
          >
            <div className="flex items-center gap-2 font-medium">
              <AtSign className="h-4 w-4" />
              Any address
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Type in any email, no EcoFurnish account needed, for reaching someone outside your
              customer list entirely.
            </p>
          </button>
        </div>
      </div>

      {audience === "custom-address" && (
        <div>
          <Label htmlFor="custom-address" className="mb-2 block">
            To
          </Label>
          <Input
            id="custom-address"
            type="email"
            value={customAddress}
            onChange={(e) => setCustomAddress(e.target.value)}
            placeholder="someone@example.com"
          />
          {customAddress.trim().length > 0 && !isValidEmail && (
            <p className="mt-1 text-xs text-destructive">That doesn&apos;t look like a valid email.</p>
          )}
        </div>
      )}

      {audience === "single-customer" && (
        <div>
          <Label htmlFor="customer-search" className="mb-2 block">
            Customer
          </Label>
          {selectedCustomer ? (
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2">
              <div>
                <p className="text-sm font-medium">{selectedCustomer.name || "(no name)"}</p>
                <p className="text-xs text-muted-foreground">{selectedCustomer.email}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedCustomer(null)}>
                Change
              </Button>
            </div>
          ) : (
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="customer-search"
                value={customerQuery}
                onChange={(e) => setCustomerQuery(e.target.value)}
                placeholder="Search by name or email…"
                className="pl-9"
              />
              {matchingCustomers.length > 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-lg border border-border bg-popover shadow-md">
                  {matchingCustomers.map((c) => (
                    <button
                      key={c.email}
                      type="button"
                      onClick={() => {
                        setSelectedCustomer(c);
                        setCustomerQuery("");
                      }}
                      className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-muted"
                    >
                      <span className="font-medium">{c.name || "(no name)"}</span>
                      <span className="text-xs text-muted-foreground">{c.email}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div>
        <Label htmlFor="broadcast-subject" className="mb-2 block">
          Subject
        </Label>
        <Input
          id="broadcast-subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="What's this about?"
        />
      </div>

      <div>
        <Label htmlFor="broadcast-body" className="mb-2 block">
          Message
        </Label>
        <Textarea
          id="broadcast-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={8}
          placeholder="Write the update here, plain text is fine, line breaks are kept."
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" onClick={sendTest} disabled={!ready || sending}>
          Send test to myself
        </Button>

        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <Button disabled={!ready || sending} onClick={() => setConfirmOpen(true)}>
            <Send className="h-4 w-4" />
            {audience === "single-customer"
              ? `Send to ${selectedCustomer?.name || "customer"}`
              : audience === "custom-address"
                ? `Send to ${customAddress.trim() || "address"}`
                : `Send to ${recipientCount} recipient${recipientCount === 1 ? "" : "s"}`}
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {audience === "single-customer"
                  ? `Send to ${selectedCustomer?.name || selectedCustomer?.email}?`
                  : audience === "custom-address"
                    ? `Send to ${customAddress.trim()}?`
                    : `Send to ${recipientCount} people?`}
              </DialogTitle>
              <DialogDescription>
                {audience === "single-customer"
                  ? `This goes out immediately to ${selectedCustomer?.email}.`
                  : audience === "custom-address"
                    ? `This goes out immediately to ${customAddress.trim()}, they don't need an EcoFurnish account for this to land.`
                    : `This goes out immediately to ${
                        audience === "subscribers"
                          ? "everyone on the newsletter list"
                          : audience === "drivers"
                            ? "every approved driver with an email on file"
                            : "every customer account"
                      }. Sending a test to yourself first is a good idea if you haven't already.`}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
              <Button onClick={sendReal} disabled={sending}>
                Send now
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
