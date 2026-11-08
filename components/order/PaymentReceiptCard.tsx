import { ExternalLink, ReceiptText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { chapaReceiptUrl, type PaymentRecord } from "@/lib/payments";
import { PrintReceiptButton } from "./PrintReceiptButton";

/**
 * The payment receipt shown on the order page. Chapa sends the customer
 * back here straight after paying (how long their own success screen stays
 * up isn't something this site controls), so this card is the receipt that
 * stays put: amount, time, method, Chapa's reference, a link to Chapa's own
 * receipt, and a print / save-as-PDF button.
 */
export function PaymentReceiptCard({
  payment,
  orderNumber,
  totalLabel,
}: {
  payment: PaymentRecord;
  orderNumber: string;
  /** The order total, already formatted for the customer's currency. */
  totalLabel: string;
}) {
  const receiptUrl = chapaReceiptUrl(payment.chapaReference);
  const paidAt = payment.paidAt
    ? new Date(payment.paidAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
    : null;

  const rows: [string, string][] = [
    ["Order", `#${orderNumber}`],
    ["Amount paid", totalLabel],
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
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="break-all text-right font-medium">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-5 flex flex-wrap gap-2 print:hidden">
        {receiptUrl && (
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<a href={receiptUrl} target="_blank" rel="noopener noreferrer" />}
          >
            <ExternalLink className="mr-1.5 h-4 w-4" />
            View Chapa receipt
          </Button>
        )}
        <PrintReceiptButton />
      </div>
    </section>
  );
}
