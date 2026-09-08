import type { ReactNode } from "react";
import Link from "next/link";
import {
  PackageSearch,
  RotateCcw,
  CreditCard,
  Truck,
  UserCog,
  MessageCircleQuestion,
  Mail,
} from "lucide-react";

const QUICK_LINKS = [
  {
    title: "Track an order",
    description: "See status, delivery progress, and past orders.",
    href: "/account/orders",
    icon: PackageSearch,
  },
  {
    title: "Start a return",
    description: "30-day return window — see conditions and how to start one.",
    href: "/returns",
    icon: RotateCcw,
  },
  {
    title: "Payment questions",
    description: "How checkout with Chapa works, and what to do about a charge.",
    href: "/dispute-resolution",
    icon: CreditCard,
  },
  {
    title: "Delivery & driving for us",
    description: "How local delivery works, and how to apply as a driver.",
    href: "/drive",
    icon: Truck,
  },
  {
    title: "Account help",
    description: "Sign-in issues, deleting your account, and preferences.",
    href: "/account",
    icon: UserCog,
  },
  {
    title: "Not seeing our emails?",
    description: "Fixes for order confirmations landing in spam.",
    href: "/help/check-spam",
    icon: Mail,
  },
];

const FAQS: { question: string; answer: ReactNode }[] = [
  {
    question: "What payment methods can I use?",
    answer: (
      <>
        Checkout is handled by Chapa, Ethiopia&apos;s payment gateway — it
        covers major cards and local options like Telebirr and bank
        transfers depending on what Chapa supports at checkout. We never see
        or store your card details ourselves.
      </>
    ),
  },
  {
    question: "How do I track my order?",
    answer: (
      <>
        Sign in and go to{" "}
        <Link href="/account/orders" className="text-primary hover:underline">
          Account → Orders
        </Link>{" "}
        to see its status. Once a driver is assigned, you can follow the
        delivery live on a map, and you&apos;ll get a PIN by email to confirm
        handoff when it arrives.
      </>
    ),
  },
  {
    question: "Can I change or cancel an order after placing it?",
    answer: (
      <>
        Reach out through the{" "}
        <Link href="/contact" className="text-primary hover:underline">
          contact page
        </Link>{" "}
        as soon as possible with your order number — we can usually help
        before it&apos;s handed off to a driver, but can&apos;t guarantee changes
        once delivery is underway.
      </>
    ),
  },
  {
    question: "What's your return policy?",
    answer: (
      <>
        Most items can be returned within 30 days of delivery if they&apos;re
        unused and in original packaging. Full details are in our{" "}
        <Link href="/returns" className="text-primary hover:underline">
          Return Policy
        </Link>
        .
      </>
    ),
  },
  {
    question: "Do you deliver outside Addis Ababa?",
    answer: (
      <>
        Our own driver network is based in Addis Ababa. If you&apos;re ordering
        from further out, ask through the{" "}
        <Link href="/contact" className="text-primary hover:underline">
          contact page
        </Link>{" "}
        before checking out and we&apos;ll let you know what&apos;s possible.
      </>
    ),
  },
  {
    question: "How do I delete my account or data?",
    answer: (
      <>
        Sign in and go to Account, then choose Delete Account — see the{" "}
        <Link href="/privacy#deleting-your-data" className="text-primary hover:underline">
          Privacy Policy
        </Link>{" "}
        for the full steps, including what to do if you can&apos;t sign in.
      </>
    ),
  },
];

export default function HelpCenterPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-16">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight">Help Center</h1>
        <p className="mt-3 text-muted-foreground">
          Find an answer below, or chat with our assistant in the bottom-right
          corner of any page.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {QUICK_LINKS.map(({ title, description, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="group rounded-xl border border-border/60 p-5 transition-colors hover:border-primary/40"
          >
            <Icon className="h-5 w-5 text-primary" />
            <p className="mt-3 font-medium">{title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </Link>
        ))}
      </div>

      <div className="mt-16">
        <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <MessageCircleQuestion className="h-6 w-6 text-primary" />
          Frequently asked questions
        </h2>

        <div className="mt-6 divide-y divide-border/60 rounded-xl border border-border/60">
          {FAQS.map(({ question, answer }) => (
            <details key={question} className="group p-5 open:bg-muted/20">
              <summary className="cursor-pointer list-none font-medium marker:content-none">
                <span className="flex items-center justify-between gap-4">
                  {question}
                  <span className="shrink-0 text-muted-foreground transition-transform group-open:rotate-45">
                    +
                  </span>
                </span>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">{answer}</p>
            </details>
          ))}
        </div>
      </div>

      <div className="mt-16 rounded-xl border border-border/60 bg-muted/20 p-6 text-center">
        <p className="font-medium">Still stuck?</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Send us a message and we&apos;ll get back to you.
        </p>
        <Link
          href="/contact"
          className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Contact us
        </Link>
      </div>
    </div>
  );
}
