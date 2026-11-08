import { LegalPage } from "@/components/site/LegalPage";

// The wording is editable in Admin -> Pages; this re-checks it every few
// minutes, and saving a page refreshes it immediately.
export const revalidate = 300;

export default function TermsPage() {
  return <LegalPage slug="terms" />;
}
