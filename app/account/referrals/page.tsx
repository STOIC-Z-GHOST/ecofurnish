import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Gift, Percent, Wallet, Truck } from "lucide-react";
import { auth } from "@/lib/auth";
import { getReferralStats, MILESTONES } from "@/lib/referrals";
import { CopyReferralLink } from "@/components/account/copy-referral-link";
import { formatPrice } from "@/lib/currency";

const TIER_META = {
  discount_code: { icon: Percent, label: "Discount code" },
  store_credit: { icon: Wallet, label: "Store credit" },
  free_shipping: { icon: Truck, label: "Free shipping voucher" },
} as const;

export default async function ReferralsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/sign-in");

  const stats = await getReferralStats(session.user.id);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const referralLink = `${appUrl}/?ref=${stats.code}`;

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <Link
        href="/account"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to account
      </Link>

      <h1 className="mb-2 text-3xl font-extrabold tracking-tight">Invite friends</h1>
      <p className="mb-8 text-muted-foreground">
        Share your link. Rewards unlock once your friends actually buy something -
        not just for signing up.
      </p>

      <section className="mb-8 rounded-lg border border-border/60 p-6">
        <h2 className="mb-3 font-semibold">Your referral link</h2>
        <CopyReferralLink link={referralLink} />
      </section>

      <section className="mb-8 grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-border/60 p-5 text-center">
          <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">{stats.invitedCount}</p>
          <p className="mt-1 text-sm text-muted-foreground">Friends invited</p>
        </div>
        <div className="rounded-lg border border-border/60 p-5 text-center">
          <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">{stats.qualifiedCount}</p>
          <p className="mt-1 text-sm text-muted-foreground">Actually purchased</p>
        </div>
      </section>

      {stats.nextMilestone && (
        <section className="mb-8 rounded-lg border border-emerald-700/30 bg-emerald-700/5 p-5">
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-400">
            {stats.nextMilestone.remaining} more purchasing friend
            {stats.nextMilestone.remaining === 1 ? "" : "s"} until your next reward
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-emerald-700/15">
            <div
              className="h-full rounded-full bg-emerald-700"
              style={{
                width: `${Math.min(
                  100,
                  (stats.qualifiedCount / stats.nextMilestone.count) * 100
                )}%`,
              }}
            />
          </div>
        </section>
      )}

      <section className="mb-8 rounded-lg border border-border/60 p-6">
        <h2 className="mb-4 font-semibold">Reward tiers</h2>
        <div className="space-y-3">
          {MILESTONES.map((m) => {
            const meta = TIER_META[m.type];
            const Icon = meta.icon;
            const unlocked = stats.qualifiedCount >= m.count;
            return (
              <div
                key={m.count}
                className={`flex items-center gap-3 rounded-lg border p-3 ${
                  unlocked ? "border-emerald-700/30 bg-emerald-700/5" : "border-border/60"
                }`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                    unlocked ? "bg-emerald-700/15 text-emerald-700 dark:text-emerald-400" : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="flex-1 text-sm">
                  <p className="font-medium">
                    {m.count} purchasing friends → {meta.label}
                  </p>
                  <p className="text-muted-foreground">
                    {m.type === "discount_code" && `${m.percentOff}% off your next order`}
                    {m.type === "store_credit" && `${m.creditAmount} ETB store credit`}
                    {m.type === "free_shipping" && `${m.creditAmount} ETB shipping voucher`}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {stats.rewards.length > 0 && (
        <section className="rounded-lg border border-border/60 p-6">
          <h2 className="mb-4 flex items-center gap-2 font-semibold">
            <Gift className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
            Your rewards
          </h2>
          <div className="space-y-3">
            {stats.rewards.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-lg border border-border/60 p-3 text-sm"
              >
                <div>
                  <p className="font-medium">
                    {r.type === "discount_code" && `${r.percentOff}% off code`}
                    {r.type === "store_credit" && "Store credit"}
                    {r.type === "free_shipping" && "Free shipping voucher"}
                  </p>
                  {r.code && <p className="font-mono text-xs text-muted-foreground">{r.code}</p>}
                  {r.creditAmount && (
                    <p className="text-xs text-muted-foreground">
                      {formatPrice(r.creditAmount, "ETB")} balance
                    </p>
                  )}
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    r.redeemed
                      ? "bg-muted text-muted-foreground"
                      : "bg-emerald-700/10 text-emerald-700 dark:text-emerald-400"
                  }`}
                >
                  {r.redeemed ? "Used" : "Available"}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
