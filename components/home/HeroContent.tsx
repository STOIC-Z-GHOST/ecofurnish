import HeroButtons from "./HeroButtons";
import HeroStats from "./HeroStats";

export default function HeroContent() {
  return (
    <div className="max-w-xl">
      <h1 className="text-4xl font-bold leading-[1.1] text-foreground sm:text-5xl lg:text-6xl">
        Give waste a second life in your living room.
      </h1>

      <p className="mt-6 text-lg leading-8 text-muted-foreground">
        Chairs, tables and shelves made from recycled plastic and reclaimed
        wood, built in Addis Ababa.
      </p>

      <HeroButtons />

      <HeroStats />
    </div>
  );
}
