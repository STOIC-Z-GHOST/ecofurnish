"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Catches errors thrown while rendering a page (or anything nested below
 * this layout) — a DB query failing, an unhandled exception, etc. Without
 * this, that shows Next's generic unbranded error screen instead. This
 * does NOT catch errors thrown in app/layout.tsx itself (e.g. the
 * categories query there) — that needs app/global-error.tsx, which
 * replaces the whole document and exists alongside this one.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Page-level error boundary caught:", error);
  }, [error]);

  return (
    <div className="container mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="size-6 text-destructive" />
      </div>
      <h1 className="mt-6 text-2xl font-extrabold tracking-tight">Something went wrong</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        This page hit a snag loading — it&apos;s probably temporary. Try again, or head back
        to the homepage.
      </p>
      <div className="mt-8 flex gap-3">
        <Button variant="outline" onClick={() => reset()}>
          Try again
        </Button>
        <Button render={<Link href="/" />}>Back to home</Button>
      </div>
    </div>
  );
}
