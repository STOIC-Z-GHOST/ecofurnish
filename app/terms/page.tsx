export default function TermsPage() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-3xl font-extrabold tracking-tight">Terms of Service</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated: {new Date().toLocaleDateString(undefined, { year: "numeric", month: "long" })}
      </p>

      <div className="mt-8 rounded-lg border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
        This is a template starting point — it isn&apos;t legal advice. Have it
        reviewed before relying on it for a real business.
      </div>

      <div className="prose prose-sm mt-8 max-w-none space-y-6 text-foreground [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_p]:text-muted-foreground">
        <div>
          <h2>Using this site</h2>
          <p>
            By creating an account or placing an order, you agree to these
            terms. You must be able to form a legally binding contract to
            use this site.
          </p>
        </div>

        <div>
          <h2>Orders and payment</h2>
          <p>
            Placing an order is an offer to buy, which we may accept or
            decline (for example, if an item is out of stock or priced
            incorrectly). Payment is processed securely by Chapa — we
            never see or store your card details. Prices, product
            descriptions, and availability may change at any time.
          </p>
        </div>

        <div>
          <h2>Returns</h2>
          <p>
            See our{" "}
            <a href="/returns" className="text-primary hover:underline">
              Return Policy
            </a>{" "}
            for return windows, conditions, and how to start a return.
          </p>
        </div>

        <div>
          <h2>Your account</h2>
          <p>
            You&apos;re responsible for keeping your password secure and for
            activity that happens under your account. Let us know right
            away if you think someone else has access to it.
          </p>
        </div>

        <div>
          <h2>Your data</h2>
          <p>
            See our{" "}
            <a href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </a>{" "}
            for what we collect and how it&apos;s used, and our{" "}
            <a href="/cookies" className="text-primary hover:underline">
              Cookie Notice
            </a>{" "}
            for what&apos;s stored in your browser.
          </p>
        </div>

        <div>
          <h2>Disputes</h2>
          <p>
            If something goes wrong with an order or charge, see our{" "}
            <a href="/dispute-resolution" className="text-primary hover:underline">
              Dispute Resolution Policy
            </a>{" "}
            for how we handle it.
          </p>
        </div>

        <div>
          <h2>Governing law</h2>
          <p>These terms are governed by the laws of Ethiopia.</p>
        </div>

        <div>
          <h2>Contact</h2>
          <p>
            Questions about these terms can be sent through the{" "}
            <a href="/contact" className="text-primary hover:underline">
              contact page
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
