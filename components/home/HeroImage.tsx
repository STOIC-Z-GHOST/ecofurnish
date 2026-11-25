import { HERO_IMAGE } from "@/config/site";
import Image from "next/image";

export default function HeroImage() {
  return (
    // A square white stage, like the product pictures, with a soft shadow.
    <div className="relative mx-auto w-full max-w-xl">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-foreground/10">
        <Image
          src={HERO_IMAGE.src}
          alt={HERO_IMAGE.alt}
          fill
          priority
          sizes="(max-width: 1024px) 90vw, 560px"
          className="object-contain"
        />
      </div>
    </div>
  );
}
