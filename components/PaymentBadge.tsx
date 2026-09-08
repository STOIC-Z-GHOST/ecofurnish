import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Small trust indicator naming the actual payment processor — shown in
 * the footer (site-wide) and again right at checkout, where it matters
 * most. No hooks, so it's safe to render from either a server or a
 * "use client" component.
 */
export default function PaymentBadge({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-xs text-muted-foreground",
        className
      )}
    >
      <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-700" />
      <span>
        Payments secured by <span className="font-medium text-foreground">Chapa</span> — we never
        see or store your card details.
      </span>
    </div>
  );
}
