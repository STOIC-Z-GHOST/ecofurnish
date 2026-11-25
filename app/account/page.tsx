import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Eye, Gift, PackageSearch, ShieldCheck, Users } from "lucide-react";
import { auth } from "@/lib/auth";
import { getAdminAccess } from "@/lib/require-admin";
import { ProfileForm } from "@/components/account/profile-form";
import { PasswordForm } from "@/components/account/password-form";
import { AvatarPicker } from "@/components/account/avatar-picker";
import { CurrencyForm } from "@/components/account/currency-form";
import { DeleteAccountButton } from "@/components/account/delete-account-button";
import { SignOutButton } from "@/components/account/sign-out-button";
import { ImpactBanner } from "@/components/account/ImpactBanner";
import { getUserPlasticDivertedKg } from "@/lib/impact";
import type { Currency } from "@/lib/currency";

export default async function AccountPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/sign-in");

  const isAdmin = session.user.role === "admin";
  // A read-only guest the owner has let in (or someone who invites guests):
  // looked up live from the server, so it disappears the moment the grant is
  // revoked or runs out. Real admins have their own card below.
  const adminAccess = isAdmin ? null : await getAdminAccess();
  const guestLevel = adminAccess?.level === "guest" || adminAccess?.level === "delegate" ? adminAccess.level : null;
  const divertedKg = await getUserPlasticDivertedKg(session.user.id);
  // Signed up with Google (or another provider)? Then there's no password to
  // "change" yet — the card offers to add one instead.
  const linkedAccounts = await auth.api.listUserAccounts({ headers: await headers() }).catch(() => []);
  const hasPassword = linkedAccounts.length === 0 || linkedAccounts.some((a) => a.providerId === "credential");
  const providerNames = linkedAccounts
    .map((a) => a.providerId)
    .filter((id) => id !== "credential")
    .map((id) => id.charAt(0).toUpperCase() + id.slice(1));

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-extrabold tracking-tight">Your Account</h1>

      <ImpactBanner kg={divertedKg} />

      <div className="mb-8 flex flex-wrap gap-3">
        <Link
          href="/account/orders"
          className="flex flex-1 items-center gap-2 rounded-lg border border-border/60 p-4 text-sm font-medium transition-colors hover:bg-muted/30"
        >
          <PackageSearch className="h-4 w-4 text-primary" />
          Order history
        </Link>
        <Link
          href="/account/referrals"
          className="flex flex-1 items-center gap-2 rounded-lg border border-border/60 p-4 text-sm font-medium transition-colors hover:bg-muted/30"
        >
          <Gift className="h-4 w-4 text-primary" />
          Invite friends
        </Link>
        {guestLevel && (
          <Link
            href={guestLevel === "guest" ? "/admin" : "/admin/guests"}
            className="flex flex-1 items-center gap-2 rounded-lg border border-border/60 p-4 text-sm font-medium transition-colors hover:bg-muted/30"
          >
            {guestLevel === "guest" ? <Eye className="h-4 w-4 text-primary" /> : <Users className="h-4 w-4 text-primary" />}
            {guestLevel === "guest" ? "Guest admin" : "Manage guests"}
          </Link>
        )}
        {isAdmin && (
          <Link
            href="/admin"
            className="flex flex-1 items-center gap-2 rounded-lg border border-border/60 p-4 text-sm font-medium transition-colors hover:bg-muted/30"
          >
            <ShieldCheck className="h-4 w-4 text-primary" />
            Admin dashboard
          </Link>
        )}
      </div>

      <div className="space-y-8">
        <section className="rounded-lg border border-border/60 p-6">
          <h2 className="font-semibold">Profile</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {session.user.email}
          </p>
          <div className="mt-4">
            <AvatarPicker initialImage={session.user.image} name={session.user.name ?? ""} />
          </div>
          <div className="mt-6">
            <ProfileForm initialName={session.user.name ?? ""} />
          </div>
        </section>

        <section className="rounded-lg border border-border/60 p-6">
          <h2 className="font-semibold">Currency</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Used as your default when browsing the catalog.
          </p>
          <div className="mt-4">
            <CurrencyForm
              initialCurrency={(session.user.preferredCurrency as Currency) || "ETB"}
            />
          </div>
        </section>

        <section className="rounded-lg border border-border/60 p-6">
          <h2 className="font-semibold">{hasPassword ? "Change password" : "Add a password"}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {hasPassword
              ? "You'll need your current password to set a new one."
              : `You signed up with ${providerNames.join(" / ") || "a social account"}, so you don't have a password yet. Add one and you can also sign in with ${session.user.email} and your password next time, signing in with ${providerNames[0] ?? "that account"} keeps working too.`}
          </p>
          <div className="mt-4">
            <PasswordForm hasPassword={hasPassword} />
          </div>
        </section>

        <section className="rounded-lg border border-border/60 p-6">
          <h2 className="font-semibold">Sign out</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            End your session on this device.
          </p>
          <div className="mt-4">
            <SignOutButton />
          </div>
        </section>

        <section className="rounded-lg border border-destructive/40 p-6">
          <h2 className="font-semibold text-destructive">Danger zone</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Permanently delete your account. We&apos;ll email a confirmation link
            first, nothing is deleted immediately.
          </p>
          <div className="mt-4">
            <DeleteAccountButton />
          </div>
        </section>
      </div>
    </div>
  );
}
