import { getSiteSettings } from "@/lib/site-settings";
import CheckoutClient from "./checkout-client";

// A thin server wrapper: it reads the Admin > Settings switch for guest
// checkout and hands it to the checkout form (which runs in the browser).
export default async function CheckoutPage() {
  const settings = await getSiteSettings();
  return <CheckoutClient guestCheckout={settings.guestCheckout} />;
}
