export default function CookiesPage() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-3xl font-extrabold tracking-tight">Cookie Notice</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated: {new Date().toLocaleDateString(undefined, { year: "numeric", month: "long" })}
      </p>

      <div className="mt-8 rounded-lg border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
        This is a template covering what EcoFurnish&apos;s own code actually
        stores in your browser — it&apos;s a reasonable starting point, not a substitute for legal advice.
      </div>

      <div className="prose prose-sm mt-8 max-w-none space-y-6 text-foreground [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_p]:text-muted-foreground [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5 [&_ul]:text-muted-foreground">
        <div>
          <h2>What this covers</h2>
          <p>
            This notice is about cookies and the similar browser storage
            (local storage) this site uses — see our{" "}
            <a href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </a>{" "}
            for what we do with any personal data collected more broadly.
          </p>
        </div>

        <div>
          <h2>Essential cookies</h2>
          <p>These are required for the site to function and can&apos;t be turned off:</p>
          <ul>
            <li>A session cookie that keeps you signed in once you log in.</li>
            <li>
              A referral cookie (kept for 30 days) that remembers which
              referral link, if any, brought you here — so the right person
              gets credit for a signup or order.
            </li>
          </ul>
        </div>

        <div>
          <h2>Local storage (not technically cookies, but similar)</h2>
          <p>These stay on your device and are never sent to a server on their own:</p>
          <ul>
            <li>Your cart and wishlist contents.</li>
            <li>Your recently-viewed products, used for &ldquo;Your Recent Finds&rdquo; and &ldquo;Pick Up From Where You Left Off&rdquo; on the homepage.</li>
            <li>Your light/dark theme choice.</li>
            <li>Whether you&apos;ve dismissed the &ldquo;install app&rdquo; prompt.</li>
          </ul>
        </div>

        <div>
          <h2>Analytics</h2>
          <p>
            We use Vercel Analytics to see aggregate traffic and page views.
            It&apos;s cookieless by design and doesn&apos;t track you individually
            across sites.
          </p>
        </div>

        <div>
          <h2>No advertising cookies</h2>
          <p>
            We don&apos;t use third-party advertising or cross-site tracking
            cookies, and we don&apos;t sell browsing data.
          </p>
        </div>

        <div>
          <h2>Managing cookies</h2>
          <p>
            Most browsers let you block or delete cookies in their settings.
            Blocking the essential ones above will likely break the ability
            to stay signed in. Clearing local storage will clear your cart,
            wishlist, and recently-viewed history on this device.
          </p>
        </div>

        <div>
          <h2>Contact</h2>
          <p>
            Questions about this notice can be sent through the{" "}
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
