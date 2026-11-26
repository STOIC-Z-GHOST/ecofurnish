import HeroContent from "./HeroContent";
import HeroImage from "./HeroImage";

// A welcome banner: a full-width living room photo with a short headline and
// one button over it. The photo sets the mood, it is not a product shot.
export default function Hero() {
  return (
    <section className="relative isolate flex min-h-[64svh] items-center overflow-hidden lg:min-h-[calc(100svh-5rem)]">
      <HeroImage />
      <div className="mx-auto w-full max-w-7xl px-6 py-12 pb-28 sm:py-20">
        <HeroContent />
      </div>
    </section>
  );
}
