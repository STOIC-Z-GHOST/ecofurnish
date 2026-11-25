import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How it's made",
  description: "The story and the tech behind the EcoFurnish demo store.",
};

const STACK = [
  { name: "Next.js and React", note: "App Router, server components, server actions" },
  { name: "Tailwind CSS", note: "Light, dark and system themes from one set of color variables" },
  { name: "Neon Postgres and Drizzle ORM", note: "Products, orders, reviews and stock" },
  { name: "Better Auth", note: "Email sign-in plus Google, Microsoft and Facebook" },
  { name: "Chapa", note: "Ethiopian payments, in test mode for this demo" },
  { name: "Resend", note: "Order and account emails" },
  { name: "Leaflet", note: "Live delivery map for drivers and dispatchers" },
  { name: "Sonner", note: "Toasts, styled to match the theme" },
  { name: "Vercel", note: "Hosting, cron jobs and analytics" },
];

export default function HowItsMadePage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-12 md:py-20">
      <p className="text-sm font-medium tracking-wide text-primary uppercase">Case study</p>
      <h1 className="mt-2 text-4xl font-bold tracking-tight md:text-5xl">The making of EcoFurnish</h1>

      <p className="mt-6 text-lg leading-8">
        Built over 3 months using React and Next.js. Features a fully functional cart,
        dark, light and system mode, and a mobile-first responsive design. Designed to simulate a
        modern e-commerce experience.
      </p>

      <h2 className="mt-12 text-2xl font-bold">Design choices</h2>
      <ul className="mt-4 space-y-3 leading-7 text-muted-foreground">
        <li>
          I studied industry leaders like Amazon to keep the mobile shopping flow as frictionless as
          possible: square product photos, full product names, and the price right under the name.
        </li>
        <li>
          For the chatbot I was inspired by Bitget&apos;s movable bot on their mobile app. On a
          phone you can drag it out of the way while you read.
        </li>
        <li>
          Warm off-white and deep forest green in light mode, soft off-black and muted sage in dark
          mode, with a serif for headings and a clean sans-serif for text.
        </li>
      </ul>

      <h2 className="mt-12 text-2xl font-bold">Tech stack</h2>
      <dl className="mt-4 divide-y divide-border rounded-lg border border-border bg-card">
        {STACK.map((item) => (
          <div key={item.name} className="flex flex-col gap-0.5 px-4 py-3 sm:flex-row sm:gap-6">
            <dt className="font-medium sm:w-60 sm:shrink-0">{item.name}</dt>
            <dd className="text-sm text-muted-foreground sm:text-base">{item.note}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-10 text-sm text-muted-foreground">
        This page is for recruiters and clients. The customers, reviews and orders in the store are
        demo data.
      </p>
      <Link href="/" className="mt-6 inline-block font-medium text-primary underline underline-offset-4">
        Back to the store
      </Link>
    </div>
  );
}
