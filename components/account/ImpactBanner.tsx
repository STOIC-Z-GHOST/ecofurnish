import { Leaf } from "lucide-react";

export function ImpactBanner({ kg }: { kg: number }) {
  return (
    <section className="mb-8 flex items-center gap-4 rounded-lg border border-primary/20 bg-primary/5 p-5">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Leaf className="h-6 w-6" />
      </span>
      <div>
        <p className="text-2xl font-extrabold tracking-tight text-primary">{kg.toFixed(1)} kg</p>
        <p className="text-sm text-muted-foreground">
          {kg > 0
            ? "of plastic diverted from landfill by your orders, thank you."
            : "Place your first order to start tracking your impact."}
        </p>
      </div>
    </section>
  );
}
