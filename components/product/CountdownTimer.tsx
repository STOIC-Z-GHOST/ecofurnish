"use client";

import { useEffect, useState } from "react";
import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

function msRemaining(endsAt: Date | string): number {
  const end = new Date(endsAt).getTime();
  return Math.max(0, end - Date.now());
}

function formatRemaining(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  // Once we're down to the final day, drop the days segment and show the
  // ticking H:MM:SS — that's the format that actually reads as "urgent."
  if (days > 0) return `${days}d ${pad(hours)}h`;
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Live countdown for a flash sale's dealEndsAt. Renders nothing until
 * mounted (avoids an SSR/client clock mismatch) and nothing at all once
 * the deal has actually expired — callers don't need to check either
 * condition themselves, just render this next to any active discount.
 */
export default function CountdownTimer({
  endsAt,
  compact = false,
  className,
}: {
  endsAt: Date | string;
  compact?: boolean;
  className?: string;
}) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    setRemaining(msRemaining(endsAt));
    const id = setInterval(() => setRemaining(msRemaining(endsAt)), 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  if (remaining === null || remaining <= 0) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-amber-600 font-semibold text-white",
        compact ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm",
        className
      )}
    >
      <Flame className={compact ? "h-3 w-3" : "h-4 w-4"} />
      Ends in {formatRemaining(remaining)}
    </span>
  );
}
