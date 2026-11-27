import { notFound } from "next/navigation";
import { getSiteSettings } from "@/lib/site-settings";
import type { Metadata } from "next";
import AboutMaker from "@/components/home/AboutMaker";

export const metadata: Metadata = {
  title: "About the maker",
  description: "Who built EcoFurnish and why.",
};

export default async function AboutTheMakerPage() {
  // Switched off in Admin > Settings: behave as if the page does not exist.
  const settings = await getSiteSettings();
  if (!settings.aboutMaker) notFound();

  return (
    <div className="container mx-auto max-w-7xl px-4 py-12 sm:py-20">
      <AboutMaker showHowItsMade={settings.howItsMade} />
    </div>
  );
}
