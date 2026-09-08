export default function PrivacyPage() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-3xl font-extrabold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated: {new Date().toLocaleDateString(undefined, { year: "numeric", month: "long" })}
      </p>

      <div className="mt-8 rounded-lg border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
        This is a template covering what EcoFurnish&apos;s own code actually
        collects and does — it&apos;s a reasonable starting point, but isn&apos;t
        legal advice.
      </div>

      <div className="prose prose-sm mt-8 max-w-none space-y-6 text-foreground [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_p]:text-muted-foreground">
        <div>
          <h2>What we collect</h2>
          <p>
            When you place an order, we collect your name, email, phone
            number, and shipping address to fulfil it. If you create an
            account, we store your name, email, and a securely hashed
            password. If you use the contact form, we collect your name,
            email, and message.
          </p>
        </div>

        <div>
          <h2>What we don&apos;t collect</h2>
          <p>
            We never see or store your payment card details — those are
            handled entirely by our payment provider, Chapa.
          </p>
        </div>

        <div>
          <h2>Cookies and local storage</h2>
          <p>
            Your cart, wishlist, and theme preference (light/dark) are
            stored in your browser&apos;s local storage, not on our servers.
            Signing in sets a session cookie so you stay logged in. See our{" "}
            <a href="/cookies" className="text-primary hover:underline">
              Cookie Notice
            </a>{" "}
            for the full list.
          </p>
        </div>

        <div>
          <h2>Third parties</h2>
          <p>
            We share order details with Chapa to process payment, and use
            Resend to send order confirmation and contact form emails.
            Neither is used for advertising.
          </p>
        </div>

        <div id="deleting-your-data">
          <h2>Deleting your data</h2>
          <p>
            If you have an account, sign in and go to{" "}
            <a href="/account" className="text-primary hover:underline">
              Account
            </a>
            , then choose Delete Account. You&apos;ll get a confirmation email —
            clicking the link in it permanently deletes your account and
            personal data. If you can&apos;t sign in (for example you&apos;ve lost
            access to the email or social account you signed up with), reach
            us through the{" "}
            <a href="/contact" className="text-primary hover:underline">
              contact page
            </a>{" "}
            and we&apos;ll delete it manually — we&apos;ll ask enough about the order
            or account to make sure we&apos;re deleting the right one.
          </p>
        </div>

        <div>
          <h2>Contact</h2>
          <p>
            Questions about your data can be sent through the{" "}
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
