"use client";

import { useEffect, useState } from "react";
import { useCurrency } from "@/lib/currency-context";
import { FX_REFRESH_INTERVAL_MS } from "@/lib/currency";

const REFRESH_MINUTES = Math.round(FX_REFRESH_INTERVAL_MS / 60_000);

function relativeTime(fromMs: number, nowMs: number): string {
  const seconds = Math.max(0, Math.round((nowMs - fromMs) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  return `${hours}h ago`;
}

/**
 * "Exchange rate updated Xm ago" — sits next to a currency picker so
 * it's clear the conversion isn't a static, possibly-stale number.
 * Ticks its own clock every 30s purely to keep the "Xm ago" text
 * current between actual rate refreshes (see currency-context.tsx for
 * where the rate itself gets refreshed).
 */
export function ExchangeRateNote({ className }: { className?: string }) {
  const { ratesUpdatedAt } = useCurrency();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  // Nothing to report yet on the very first client render (avoids a
  // hydration mismatch from Date.now() differing between server/client).
  if (!ratesUpdatedAt || !now) {
    return (
      <p className={className}>Exchange rates refresh every {REFRESH_MINUTES} minutes.</p>
    );
  }

  return (
    <p className={className}>
      Exchange rates refresh every {REFRESH_MINUTES} minutes, updated {relativeTime(ratesUpdatedAt, now)}.
    </p>
  );
}
