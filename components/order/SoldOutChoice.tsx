"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Hourglass, Ticket, Undo2 } from "lucide-react";
import { resolveSoldOutOrder } from "@/app/actions/orders";
import { Button } from "@/components/ui/button";

type Choice = "refund" | "wait" | "credit";

interface Props {
  orderId: string;
  /** "choose" = still deciding, "waiting" = already chose to wait. */
  state: "choose" | "waiting";
  itemName: string;
  /** Formatted amount the customer paid, e.g. "1,234.00 ETB". */
  amount: string;
  /** Whether a restock is expected (otherwise "wait" isn't offered). */
  restockExpected: boolean;
  /** Earliest known restock time, ISO string, if any. */
  restockAt: string | null;
  canUseCredit: boolean;
}

const MESSAGES: Record<string, string> = {
  waiting: "Got it — we'll hold your order and email you the moment it's confirmed.",
  refunded: "Refunded — it can take a few days to show up with your payment provider.",
  refund_pending: "Cancelled — your refund is being processed and we'll email you when it's sent.",
  credited: "Done — the store credit is on your account. Tick “use store credit” at checkout.",
};

export function SoldOutChoice({
  orderId,
  state,
  itemName,
  amount,
  restockExpected,
  restockAt,
  canUseCredit,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<Choice | null>(null);

  function choose(choice: Choice) {
    setBusy(choice);
    startTransition(async () => {
      try {
        const result = await resolveSoldOutOrder(orderId, choice);
        if (!result.success) {
          toast.error(result.error);
        } else {
          toast.success(MESSAGES[result.outcome] ?? "Done.");
        }
      } catch {
        toast.error("Something went wrong — please try again.");
      } finally {
        setBusy(null);
        router.refresh();
      }
    });
  }

  const restockText = restockAt
    ? `Expected around ${new Date(restockAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}.`
    : "We restock sold-out items regularly.";

  if (state === "waiting") {
    return (
      <div className="mt-8 rounded-xl border border-border/60 bg-muted/40 p-5 text-left">
        <div className="flex items-center gap-2 font-semibold">
          <Hourglass className="h-4 w-4" /> Waiting for {itemName} to be restocked
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          You&apos;ve paid {amount} and that price is locked — you&apos;ll never be asked for more,
          even if the price goes up. We&apos;ll email you as soon as the order is confirmed. {restockText}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" disabled={pending} onClick={() => choose("refund")}>
            {busy === "refund" ? "Working…" : "Cancel and refund instead"}
          </Button>
          {canUseCredit && (
            <Button variant="outline" disabled={pending} onClick={() => choose("credit")}>
              {busy === "credit" ? "Working…" : "Switch to store credit"}
            </Button>
          )}
        </div>
      </div>
    );
  }

  const options: { id: Choice; icon: typeof Undo2; title: string; body: string; hidden?: boolean }[] = [
    {
      id: "refund",
      icon: Undo2,
      title: "Refund me",
      body: `The full ${amount} goes back to your original payment method.`,
    },
    {
      id: "wait",
      icon: Hourglass,
      title: "Wait for the restock",
      body: `We keep your order and confirm it automatically when ${itemName} is back. ${restockText} Your price is locked — you won't pay more even if it rises.`,
      hidden: !restockExpected,
    },
    {
      id: "credit",
      icon: Ticket,
      title: "Get store credit",
      body: `The full ${amount} becomes credit you can spend on any other product.`,
      hidden: !canUseCredit,
    },
  ];

  return (
    <div className="mt-8 text-left">
      <h2 className="text-lg font-semibold">What would you like to do?</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Your payment is safe — pick one and we&apos;ll take care of the rest.
      </p>
      <div className="mt-4 grid gap-3">
        {options
          .filter((o) => !o.hidden)
          .map((o) => (
            <div
              key={o.id}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-border/60 bg-card p-4"
            >
              <o.icon className="h-5 w-5 shrink-0 text-primary" />
              <div className="min-w-[200px] flex-1">
                <p className="font-medium">{o.title}</p>
                <p className="text-sm text-muted-foreground">{o.body}</p>
              </div>
              <Button disabled={pending} onClick={() => choose(o.id)}>
                {busy === o.id ? "Working…" : "Choose"}
              </Button>
            </div>
          ))}
      </div>
    </div>
  );
}
