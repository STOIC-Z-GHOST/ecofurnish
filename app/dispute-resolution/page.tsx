export default function DisputeResolutionPage() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-3xl font-extrabold tracking-tight">Dispute Resolution Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated: {new Date().toLocaleDateString(undefined, { year: "numeric", month: "long" })}
      </p>

      <div className="mt-8 rounded-lg border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
        This is a template starting point — it isn&apos;t legal advice. Have it
        reviewed before relying on it for a real business.
      </div>

      <div className="prose prose-sm mt-8 max-w-none space-y-6 text-foreground [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_p]:text-muted-foreground">
        <div>
          <h2>Talk to us first</h2>
          <p>
            Most order problems — wrong item, damage in transit, a payment
            that didn&apos;t go through cleanly — are fastest to sort out
            directly. Reach out through the{" "}
            <a href="/contact" className="text-primary hover:underline">
              contact page
            </a>{" "}
            with your order number and we&apos;ll look into it.
          </p>
        </div>

        <div>
          <h2>Order and delivery issues</h2>
          <p>
            For a missing, damaged, or incorrect delivery, tell us within 7
            days of the delivery date so we can investigate while it&apos;s
            still fresh with our dispatch and delivery records. See our{" "}
            <a href="/returns" className="text-primary hover:underline">
              Return Policy
            </a>{" "}
            for returns and refunds specifically.
          </p>
        </div>

        <div>
          <h2>Payment disputes</h2>
          <p>
            Payments are processed by Chapa. If a charge looks wrong,
            contact us first with your order number — most issues (a
            duplicate charge, a failed payment that still debited you) are
            resolved faster this way than starting a chargeback, which can
            take longer and puts the order on hold while it&apos;s investigated.
          </p>
        </div>

        <div>
          <h2>If we can&apos;t agree</h2>
          <p>
            If we&apos;re unable to resolve something directly, either side can
            propose mediation before pursuing anything more formal. Any
            dispute that isn&apos;t resolved through mediation is subject to the
            laws of Ethiopia, as set out in our{" "}
            <a href="/terms" className="text-primary hover:underline">
              Terms of Service
            </a>
            .
          </p>
        </div>

        <div>
          <h2>Contact</h2>
          <p>
            Reach us through the{" "}
            <a href="/contact" className="text-primary hover:underline">
              contact page
            </a>{" "}
            with your order number and a description of the issue, and
            we&apos;ll get back to you.
          </p>
        </div>
      </div>
    </div>
  );
}
