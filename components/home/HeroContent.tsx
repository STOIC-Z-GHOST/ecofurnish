import HeroButtons from "./HeroButtons";
import HeroStats from "./HeroStats";

export default function HeroContent() {
  return (
    <div className="max-w-xl">
      <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-700">
        🌱 Sustainable Furniture
      </span>

      <h1 className="mt-6 text-5xl font-bold leading-tight text-foreground">
        Furniture Built to{" "}
        <span className="text-primary">
          Last Generations
        </span>
      </h1>

      <p className="mt-6 text-lg leading-8 text-muted-foreground">
        Crafted from sustainably sourced materials with timeless designs that
        bring comfort, elegance, and durability into every home.
      </p>

      <HeroButtons />

      <HeroStats />
    </div>
  );
}