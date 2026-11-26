import Image from "next/image";

// Text sits on the left, so the dark gradient is strongest there. On a
// phone the whole picture gets an even darker wash so the words stay
// readable whichever part of the photo is showing.
export default function HeroImage() {
  return (
    <>
      <Image
        src="/images/hero-living-room.jpg"
        alt="A warm, modern living room with cream sofas and a round coffee table"
        fill
        priority
        sizes="100vw"
        className="-z-20 object-cover object-center"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-r from-black/75 via-black/45 to-black/10 max-md:bg-black/55"
      />
    </>
  );
}
