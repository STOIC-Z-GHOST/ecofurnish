import { ExternalLink, ReceiptText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { chapaReceiptUrl, type PaymentRecord } from "@/lib/payments";
import { PrintReceiptButton } from "./PrintReceiptButton";

/**
 * The payment receipt shown on the order page. Chapa sends the customer
 * back here straight after paying (how long their own success screen stays
 * up isn't something this site controls), so this card IS the receipt that
 * stays put: who paid, what for, how much, when, how, and Chapa's
 * reference — printable / savable as PDF. It never depends on Chapa's own
 * hosted receipt page; a link to that is an optional extra.
 */
export function PaymentReceiptCard({
  payment,
  orderNumber,
  totalLabel,
  customerName,
  customerEmail,
  items,
  showChapaLink,
  testMode,
}: {
  payment: PaymentRecord;
  orderNumber: string;
  /** The order total, already formatted for the customer's currency. */
  totalLabel: string;
  customerName: string;
  customerEmail: string;
  items: { name: string; quantity: number; unitLabel: string }[];
  /** Show the link to Chapa's own hosted receipt. */
  showChapaLink: boolean;
  /** Using Chapa test keys (explains why the Chapa link is hidden). */
  testMode: boolean;
}) {
  const receiptUrl = showChapaLink ? chapaReceiptUrl(payment.chapaReference) : null;
  const paidAt = payment.paidAt
    ? new Date(payment.paidAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
    : null;

  const rows: [string, string][] = [
    ["Order", `#${orderNumber}`],
    ["Billed to", `${customerName} · ${customerEmail}`],
    ...(paidAt ? ([["Paid on", paidAt]] as [string, string][]) : []),
    ...(payment.method ? ([["Method", payment.method]] as [string, string][]) : []),
    ["Chapa reference", payment.chapaReference],
  ];

  return (
    <section id="receipt" className="mt-10 rounded-lg border border-border/60 p-6">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <ReceiptText className="h-5 w-5 text-primary" />
        Payment receipt
      </h2>

      <dl className="mt-4 divide-y divide-border/60 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 py-2">
            <dt className="shrink-0 text-muted-foreground">{label}</dt>
            <dd className="break-all text-right font-medium">{value}</dd>
          </div>
        ))}
      </dl>

      {items.length > 0 && (
        <ul className="mt-2 divide-y divide-border/60 border-t border-border/60 text-sm">
          {items.map((item, i) => (
            <li key={i} className="flex justify-between gap-4 py-2">
              <span>
                {item.quantity} × {item.name}
              </span>
              <span className="shrink-0 text-muted-foreground">{item.unitLabel} each</span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex justify-between gap-4 border-t border-border/60 pt-3 font-semibold">
        <span>Amount paid</span>
        <span>{totalLabel}</span>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2 print:hidden">
        <PrintReceiptButton />
        {receiptUrl && (
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<a href={receiptUrl} target="_blank" rel="noopener noreferrer" />}
          >
            <ExternalLink className="mr-1.5 h-4 w-4" />
            Open Chapa&apos;s receipt
          </Button>
        )}
      </div>
      {testMode && !showChapaLink && (
        <p className="mt-3 text-xs text-muted-foreground print:hidden">
          Test-mode payment — the link to Chapa&apos;s own receipt only appears for live payments.
        </p>
      )}
    </section>
  );
}
