export default function ReturnsPage() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-3xl font-extrabold tracking-tight">Return Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated: {new Date().toLocaleDateString(undefined, { year: "numeric", month: "long" })}
      </p>

      <div className="mt-8 rounded-lg border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
       This is a template covering what EcoFurnish&apos;s own code actually
        stores in your browser — it&apos;s a reasonable starting point, not a substitute for legal advice.
      </div>

      <div className="prose prose-sm mt-8 max-w-none space-y-6 text-foreground [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_p]:text-muted-foreground">
        <div>
          <h2>30-day return window</h2>
          <p>
            You can return most items within 30 days of delivery for a
            refund. The 30 days is counted from the delivery date on your
            order, not the order date.
          </p>
        </div>

        <div>
          <h2>Condition</h2>
          <p>
            Items must be unused, in their original condition, and in the
            original packaging. Items that show signs of use or assembly
            can&apos;t be accepted for a refund.
          </p>
        </div>

        <div>
          <h2>Return shipping</h2>
          <p>
            Return shipping is paid by the buyer, unless the item arrived
            damaged, defective, or wasn&apos;t what you ordered — in that case
            we cover it.
          </p>
        </div>

        <div>
          <h2>Refunds</h2>
          <p>
            Once we&apos;ve received and inspected the returned item, we&apos;ll
            process your refund to your original payment method. Refunds
            can take a few business days to appear, depending on your bank
            or mobile money provider.
          </p>
        </div>

        <div>
          <h2>How to start a return</h2>
          <p>
            Reach out through the{" "}
            <a href="/contact" className="text-primary hover:underline">
              contact page
            </a>{" "}
            with your order number and which item(s) you&apos;d like to
            return, and we&apos;ll walk you through the next steps.
          </p>
        </div>
      </div>
    </div>
  );
}
