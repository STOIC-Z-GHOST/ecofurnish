import { Check } from "lucide-react";

// Plain facts about how the furniture is made, taken from the About page.
// No customer counts or awards here: only things that are true of the store.
const facts = [
  "Recycled plastic and reclaimed wood",
  "Built in Addis Ababa",
  "Plastic diverted shown on every piece",
];

export default function HeroStats() {
  return (
    <ul className="mt-10 space-y-2.5">
      {facts.map((fact) => (
        <li key={fact} className="flex items-center gap-2.5 text-sm text-muted-foreground">
          <Check className="size-4 shrink-0 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
          {fact}
        </li>
      ))}
    </ul>
  );
}
