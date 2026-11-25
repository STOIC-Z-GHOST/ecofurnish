import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How it's made",
  description:
    "The making of EcoFurnish: the tech stack, the build time and the thinking behind the design.",
};

const STACK = [
  { name: "Next.js 16 and React 19", note: "App Router, server components, TypeScript" },
  { name: "Tailwind CSS 4 and shadcn/ui", note: "Theme variables for light, dark and system mode" },
  { name: "Neon Postgres and Drizzle", note: "Products, orders, reviews, referrals" },
  { name: "Better Auth", note: "Email sign-in plus Google and Microsoft login" },
  { name: "Chapa", note: "Payments for Ethiopia" },
  { name: "Sonner and Leaflet", note: "Cart notifications and live delivery maps" },
];

export default function HowItsMadePage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-12 sm:py-20">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">The making of EcoFurnish</h1>

      <p className="mt-6 text-lg leading-8 text-muted-foreground">
        Built over 3 months using React and Next.js. Features a fully functional cart,
        dark, light and system mode, and a mobile-first responsive design. Designed to
        simulate a modern e-commerce experience.
      </p>

      <h2 className="mt-12 text-2xl font-bold sm:text-3xl">Where the ideas came from</h2>
      <p className="mt-4 leading-7 text-muted-foreground">
        I studied industry leaders like Amazon to make the mobile shopping flow as
        frictionless as possible: two-column discovery on the homepage, and one-column
        horizontal cards on the shop list so full product names have room to breathe.
      </p>
      <p className="mt-4 leading-7 text-muted-foreground">
        For the chatbot I was inspired by Bitget&apos;s movable bot on their mobile app. On a
        phone, the assistant bubble can be dragged to either side so it never blocks what
        you are reading.
      </p>

      <h2 className="mt-12 text-2xl font-bold sm:text-3xl">What it runs on</h2>
      <ul className="mt-6 divide-y divide-border rounded-xl border border-border bg-card">
        {STACK.map((item) => (
          <li key={item.name} className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-baseline sm:justify-between">
            <span className="font-medium text-foreground">{item.name}</span>
            <span className="text-sm text-muted-foreground">{item.note}</span>
          </li>
        ))}
      </ul>

      <p className="mt-10 text-sm text-muted-foreground">
        This page is for recruiters and clients who want to see how the site was put
        together.{" "}
        <Link href="/" className="font-medium text-primary underline-offset-4 hover:underline">
          Back to the store
        </Link>
      </p>
    </div>
  );
}
