import HeroButtons from "./HeroButtons";

// White text on purpose, in light and dark mode alike: it sits on a photo
// with a dark wash, not on the page background.
export default function HeroContent() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-4xl font-bold leading-[1.1] text-white sm:text-5xl lg:text-6xl">
        Give waste a second life in your living room.
      </h1>

      <p className="mt-6 max-w-xl text-lg leading-8 text-white/85">
        Furniture made from recycled plastic and reclaimed wood, designed for
        homes that feel good to come back to.
      </p>

      <HeroButtons />
    </div>
  );
}
