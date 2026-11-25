import { Leaf, Package, Truck } from "lucide-react";

interface ImpactProps {
  /** Total plastic (kg) diverted across the products currently listed. */
  plasticKg: number;
  productCount: number;
}

/** Three clean cards: small icon, one big number, one line of text. */
export default function Impact({ plasticKg, productCount }: ImpactProps) {
  const items = [
    {
      icon: Leaf,
      value: `${Math.round(plasticKg)} kg`,
      text: "of plastic diverted across the current collection.",
    },
    {
      icon: Package,
      value: String(productCount),
      text: "pieces, each labeled with its own plastic weight.",
    },
    {
      icon: Truck,
      value: "Addis Ababa",
      text: "where every order is made, finished and shipped from.",
    },
  ];

  return (
    <section id="about" className="border-t border-border/60 bg-muted/30">
      <div className="container mx-auto max-w-7xl px-4 py-12 md:py-20">
        <h2 className="mb-6 text-3xl font-bold tracking-tight md:mb-10 md:text-4xl">Our Impact</h2>
        <div className="grid gap-4 sm:grid-cols-3 md:gap-6">
          {items.map(({ icon: Icon, value, text }) => (
            <div key={value} className="rounded-lg border border-border bg-card p-6">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
              </span>
              <p className="mt-4 font-heading text-3xl font-bold text-foreground md:text-4xl">
                {value}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
