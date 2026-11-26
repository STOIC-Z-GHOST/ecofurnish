import type { Metadata } from "next";
import AboutMaker from "@/components/home/AboutMaker";

export const metadata: Metadata = {
  title: "About the maker",
  description: "Who built EcoFurnish and why.",
};

export default function AboutTheMakerPage() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-12 sm:py-20">
      <AboutMaker />
    </div>
  );
}
