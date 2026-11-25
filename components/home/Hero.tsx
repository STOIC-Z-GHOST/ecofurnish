import HeroContent from "./HeroContent";
import HeroImage from "./HeroImage";

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-12 sm:py-16 lg:min-h-[calc(100vh-5rem)] lg:grid-cols-2 lg:gap-16 lg:py-20">
        <HeroContent />
        <HeroImage />
      </div>
    </section>
  );
}
