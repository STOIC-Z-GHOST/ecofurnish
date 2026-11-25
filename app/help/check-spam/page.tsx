export const metadata = {
  title: "Not seeing our emails?, EcoFurnish",
};

const PROVIDER_STEPS: { name: string; steps: string[] }[] = [
  {
    name: "Gmail",
    steps: [
      "Open the Spam folder in the left sidebar (under \"More\" if it's hidden).",
      "Find the EcoFurnish email and open it.",
      "Click \"Report not spam\" at the top of the message.",
      "Optional: drag the sender (admin@ecofurnish.abrdns.com) into a contact group, or star the email, so Gmail learns to trust it.",
    ],
  },
  {
    name: "Outlook / Hotmail",
    steps: [
      "Open the Junk Email folder.",
      "Right-click the EcoFurnish email.",
      "Choose \"Not junk\" (or \"Mark as not junk\").",
      "Optional: add admin@ecofurnish.abrdns.com to your Safe Senders list under Settings → Mail → Junk email.",
    ],
  },
  {
    name: "Yahoo Mail",
    steps: [
      "Open the Spam folder.",
      "Select the EcoFurnish email.",
      "Click \"Not Spam\" in the toolbar.",
      "Yahoo moves it back to your inbox and remembers the sender for next time.",
    ],
  },
  {
    name: "Apple Mail / iCloud",
    steps: [
      "Open the Junk mailbox.",
      "Select the EcoFurnish email.",
      "Click the flag/move icon (or use Message → Move to → Inbox), then confirm \"Not Junk\" if prompted.",
    ],
  },
];

export default function CheckSpamHelpPage() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-3xl font-extrabold tracking-tight">Not seeing our emails?</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Account verification, order updates, and delivery PINs all come from{" "}
        <span className="font-medium text-foreground">admin@ecofurnish.abrdns.com</span>, here&apos;s
        how to find one that landed in spam, and how to stop it happening again.
      </p>

      <div className="mt-8 rounded-lg border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
        Start with your Spam or Junk folder and search for &quot;EcoFurnish&quot;. If you find the
        email there, marking it &quot;Not spam&quot; (steps below, by provider) is what actually
        fixes it for next time, deleting it or just moving it to your inbox doesn&apos;t teach your
        mail provider anything.
      </div>

      <div className="prose prose-sm mt-8 max-w-none space-y-6 text-foreground [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_p]:text-muted-foreground">
        {PROVIDER_STEPS.map((provider) => (
          <div key={provider.name}>
            <h2>{provider.name}</h2>
            <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
              {provider.steps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </div>
        ))}

        <div>
          <h2>Still can&apos;t find it?</h2>
          <p>
            Double check the email address on your account is spelled correctly, then try the
            resend link on the sign-up or sign-in page. If it&apos;s genuinely not arriving, reach us
            through the{" "}
            <a href="/contact" className="text-primary hover:underline">
              contact page
            </a>{" "}
            and we&apos;ll help sort it out.
          </p>
        </div>
      </div>
    </div>
  );
}
