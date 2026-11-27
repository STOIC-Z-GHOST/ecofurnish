import FooterBottom from "./FooterBottom";
import FooterBrand from "./FooterBrand";
import FooterLinks from "./FooterLinks";
import FooterSocials from "./FooterSocials";
import PaymentBadge from "@/components/PaymentBadge";
import { getSiteSettings } from "@/lib/site-settings";
import { FOOTER_LINKS } from "@/data/footer-links";

export default async function Footer() {
  const settings = await getSiteSettings();
  // Links the owner switched off in Admin > Settings are left out.
  const company = FOOTER_LINKS.company.filter(
    (l) =>
      !(l.href === "/about-the-maker" && !settings.aboutMaker) &&
      !(l.href === "/how-its-made" && !settings.howItsMade)
  );
  return (
    <footer className="bg-background border-t border-border pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
      <div className="container mx-auto px-4 pt-16 pb-8">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <FooterBrand />
            <div className="mt-6 flex flex-col gap-4">
              <FooterSocials />
              <PaymentBadge className="w-fit" />
            </div>
          </div>

          <FooterLinks title="Shop" links={FOOTER_LINKS.shop} />
          <FooterLinks title="Company" links={company} />
          <FooterLinks title="Legal" links={FOOTER_LINKS.legal} />
        </div>

        <FooterBottom />
      </div>
    </footer>
  );
}
