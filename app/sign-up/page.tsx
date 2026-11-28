import Link from "next/link";
import { getEnabledSocialProviders } from "@/lib/social-providers";
import { getSiteSettings } from "@/lib/site-settings";
import { SignUpForm } from "./sign-up-form";

export default async function SignUpPage() {
  // Paused from Admin > Settings: say so plainly instead of showing a form
  // that would only fail.
  if (!(await getSiteSettings()).signUpsOpen) {
    return (
      <div className="container mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="text-2xl font-semibold">Sign-ups are paused</h1>
        <p className="mt-2 text-muted-foreground">
          We are not accepting new accounts right now. Please check back soon. If you already have
          an account, you can sign in as usual.
        </p>
        <Link
          href="/sign-in"
          className="mt-6 inline-flex h-10 items-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Sign in
        </Link>
      </div>
    );
  }

  const socialProviders = getEnabledSocialProviders();
  return <SignUpForm socialProviders={socialProviders} />;
}
