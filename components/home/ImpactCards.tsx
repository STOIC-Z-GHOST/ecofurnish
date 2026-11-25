import { Leaf, Recycle, Truck } from "lucide-react";
import SectionHeading from "./SectionHeading";

interface ImpactCardsProps {
  /** Total plastic (kg) across one of every piece in the catalog. */
  plasticKg: number;
  /** How many pieces are in the catalog right now. */
  pieces: number;
}

// Three short cards: an icon, one big figure, a label and a single line.
// The figures come from the catalog itself, so they never drift out of date.
export default function ImpactCards({ plasticKg, pieces }: ImpactCardsProps) {
  const cards = [
    {
      icon: Recycle,
      figure: `${plasticKg.toLocaleString("en-US", { maximumFractionDigits: 1 })} kg`,
      title: "Plastic diverted",
      line: "In one of every piece in the collection.",
    },
    {
      icon: Leaf,
      figure: String(pieces),
      title: "Pieces, each labeled",
      line: "Every listing shows its own plastic weight.",
    },
    {
      icon: Truck,
      figure: "Addis Ababa",
      title: "Made and shipped locally",
      line: "Short trips keep transport emissions low.",
    },
  ];

  return (
    <section id="about" className="border-t border-border/60 py-12 sm:py-20">
      <div className="container mx-auto max-w-7xl px-4">
        <SectionHeading title="Our impact" />

        <div className="grid gap-4 sm:grid-cols-3 sm:gap-6 lg:gap-8">
          {cards.map(({ icon: Icon, figure, title, line }) => (
            <div
              key={title}
              className="rounded-xl border border-border bg-card p-6 sm:p-8"
            >
              <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <p className="mt-6 font-heading text-4xl font-bold tracking-tight text-foreground">
                {figure}
              </p>
              <h3 className="mt-2 font-sans text-base font-semibold text-foreground">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{line}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
