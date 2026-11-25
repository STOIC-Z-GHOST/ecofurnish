import { cookies } from "next/headers";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { orders, referralCodes, referralRewards, referralRewardUsages, referrals } from "@/db/schema";
import { REFERRAL_COOKIE } from "@/lib/referral-cookie";

// Unambiguous charset — no 0/O or 1/I, so a code read aloud or handwritten
// doesn't get mistyped.
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomCode(length: number): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return out;
}

/**
 * Tiered referral rewards. Each `count` is the number of a user's invited
 * friends who have actually gone on to buy something — invites alone don't
 * count. Edit the numbers here to retune the program; nothing else needs
 * to change.
 */
export const MILESTONES = [
  { count: 5, type: "discount_code" as const, percentOff: 10 },
  { count: 15, type: "store_credit" as const, creditAmount: "500.00" },
  // There's no separate shipping-fee line item in checkout today, so this
  // is implemented as a flat credit rather than an actual waived fee —
  // functionally the same discount, just labeled for what it's meant to be.
  { count: 30, type: "free_shipping" as const, creditAmount: "300.00" },
];

/** Fetches a user's referral code, creating one on first use. */
export async function getOrCreateReferralCode(userId: string): Promise<string> {
  const [existing] = await db
    .select()
    .from(referralCodes)
    .where(eq(referralCodes.userId, userId))
    .limit(1);
  if (existing) return existing.code;

  // Collisions are astronomically unlikely at this scale, but retry a
  // couple of times rather than letting a fluke 500 the page.
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const [row] = await db
        .insert(referralCodes)
        .values({ userId, code: randomCode(7) })
        .returning();
      return row.code;
    } catch {
      // unique constraint hit — try again with a fresh code
    }
  }
  throw new Error("Couldn't generate a referral code, please try again.");
}

/**
 * Call this once, right after a new user's account becomes real (i.e. on
 * email verification, not raw signup — see lib/auth.ts) to credit whoever
 * referred them, if anyone did.
 */
export async function attributeReferral(newUserId: string) {
  const cookieStore = await cookies();
  const code = cookieStore.get(REFERRAL_COOKIE)?.value;
  if (!code) return;

  const [codeRow] = await db
    .select()
    .from(referralCodes)
    .where(eq(referralCodes.code, code))
    .limit(1);
  if (!codeRow) return;
  if (codeRow.userId === newUserId) return; // can't refer yourself

  try {
    await db.insert(referrals).values({
      referrerId: codeRow.userId,
      referredUserId: newUserId,
    });
  } catch {
    // Already has a referral row (unique on referredUserId) — ignore.
  }
}

/**
 * Call this after an order is confirmed paid. If this was that buyer's
 * first-ever paid order and they were referred by someone, marks the
 * referral qualified and issues a reward if this crossed a milestone.
 * Safe to call more than once — it only acts on the crossing.
 */
export async function qualifyReferralIfFirstPurchase(userId: string) {
  const [{ count: paidCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(orders)
    .where(and(eq(orders.userId, userId), eq(orders.paymentStatus, "paid")));
  if (paidCount !== 1) return; // not their first paid order

  const [referral] = await db
    .select()
    .from(referrals)
    .where(and(eq(referrals.referredUserId, userId), eq(referrals.qualified, false)))
    .limit(1);
  if (!referral) return; // wasn't referred, or already qualified

  await db
    .update(referrals)
    .set({ qualified: true, qualifiedAt: new Date() })
    .where(eq(referrals.id, referral.id));

  const [{ count: qualifiedCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(referrals)
    .where(and(eq(referrals.referrerId, referral.referrerId), eq(referrals.qualified, true)));

  const milestone = MILESTONES.find((m) => m.count === qualifiedCount);
  if (!milestone) return;

  // Fast-path check — avoids a wasted insert attempt in the common case,
  // but isn't what actually prevents a double-issue: two referrals
  // qualifying in the same instant could both pass this check before
  // either insert lands. referral_rewards_user_milestone_idx (a real
  // unique constraint on userId+milestone, see db/schema.ts) is what
  // actually enforces it — the catch below is the real guard.
  const [already] = await db
    .select()
    .from(referralRewards)
    .where(
      and(
        eq(referralRewards.userId, referral.referrerId),
        eq(referralRewards.milestone, milestone.count)
      )
    )
    .limit(1);
  if (already) return;

  try {
    if (milestone.type === "discount_code") {
      await db.insert(referralRewards).values({
        userId: referral.referrerId,
        type: "discount_code",
        milestone: milestone.count,
        code: randomCode(8),
        percentOff: milestone.percentOff,
      });
    } else {
      await db.insert(referralRewards).values({
        userId: referral.referrerId,
        type: milestone.type,
        milestone: milestone.count,
        code: milestone.type === "free_shipping" ? randomCode(8) : null,
        creditAmount: milestone.creditAmount,
      });
    }
  } catch (err) {
    // 23505 = unique_violation. The other concurrent qualification won
    // the race and already inserted this tier's reward — that's the
    // expected/correct outcome here, not a real error, so swallow it
    // rather than letting it bubble up and break payment confirmation.
    if (!isUniqueViolation(err)) throw err;
  }
}

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: unknown }).code === "23505"
  );
}

export interface ReferralStats {
  code: string;
  invitedCount: number;
  qualifiedCount: number;
  nextMilestone: { count: number; remaining: number } | null;
  rewards: {
    id: string;
    type: string;
    milestone: number;
    code: string | null;
    percentOff: number | null;
    creditAmount: string | null;
    redeemed: boolean;
  }[];
}

export async function getReferralStats(userId: string): Promise<ReferralStats> {
  const code = await getOrCreateReferralCode(userId);
  const rows = await db.select().from(referrals).where(eq(referrals.referrerId, userId));
  const qualifiedCount = rows.filter((r) => r.qualified).length;
  const nextMilestoneCount = MILESTONES.map((m) => m.count).find((c) => c > qualifiedCount);

  const rewards = await db
    .select()
    .from(referralRewards)
    .where(eq(referralRewards.userId, userId))
    .orderBy(referralRewards.createdAt);

  return {
    code,
    invitedCount: rows.length,
    qualifiedCount,
    nextMilestone: nextMilestoneCount
      ? { count: nextMilestoneCount, remaining: nextMilestoneCount - qualifiedCount }
      : null,
    rewards: rewards.map((r) => ({
      id: r.id,
      type: r.type,
      milestone: r.milestone,
      code: r.code,
      percentOff: r.percentOff,
      creditAmount: r.creditAmount,
      redeemed: r.redeemed,
    })),
  };
}

/** Total unredeemed store credit / free-shipping-voucher balance, as a decimal string. */
export async function getAvailableCredit(userId: string): Promise<string> {
  const rows = await db
    .select()
    .from(referralRewards)
    .where(
      and(
        eq(referralRewards.userId, userId),
        eq(referralRewards.redeemed, false),
        sql`${referralRewards.type} in ('store_credit', 'free_shipping')`
      )
    );
  const total = rows.reduce((sum, r) => sum + parseFloat(r.creditAmount ?? "0"), 0);
  return total.toFixed(2);
}

export interface RewardApplication {
  discountAmount: string;
  note: string | null;
}

/**
 * Applies a promo code and/or the user's available store credit to an
 * order total, and marks whatever was used as redeemed/decremented.
 * Called from createOrder() right after the order row is inserted (so
 * `orderId` already exists) — every reward this touches gets a matching
 * referralRewardUsages row recording exactly how much of it this order
 * took, which is what makes reverseOrderRewardUsages possible later if
 * the order never ends up paid.
 */
export async function applyReferralRewards(
  userId: string,
  subtotal: number,
  options: { promoCode?: string; useStoreCredit?: boolean },
  orderId: string
): Promise<RewardApplication> {
  let remaining = subtotal;
  const notes: string[] = [];

  // Every redemption below is ONE SQL statement that both claims the reward
  // (guarded by "still unredeemed" / "balance still covers this") and records
  // the usage row. Reading a reward and then writing it back in a second
  // step let two simultaneous checkouts both spend the same code or the same
  // balance; now the database lets exactly one of them through, and a
  // statement that matches nothing simply means "someone else got there first".

  if (options.promoCode) {
    const code = options.promoCode.trim().toUpperCase();
    const [reward] = await db
      .select()
      .from(referralRewards)
      .where(
        and(
          eq(referralRewards.userId, userId),
          eq(referralRewards.code, code),
          eq(referralRewards.redeemed, false)
        )
      )
      .limit(1);

    if (reward) {
      let off = 0;
      let note: string | null = null;
      if (reward.type === "discount_code" && reward.percentOff) {
        off = Math.min(remaining, subtotal * (reward.percentOff / 100));
        note = `Referral reward: ${reward.percentOff}% off (code ${code})`;
      } else if (reward.type === "free_shipping" && reward.creditAmount) {
        off = Math.min(remaining, parseFloat(reward.creditAmount));
        note = `Free shipping voucher applied (code ${code})`;
      }
      off = roundToCents(off);
      if (off > 0 && note) {
        const claimed = await db.execute(sql`
          with claimed as (
            update referral_rewards
               set redeemed = true, redeemed_at = now()
             where id = ${reward.id} and user_id = ${userId} and redeemed = false
            returning id
          )
          insert into referral_reward_usages (id, order_id, reward_id, amount_used)
          select ${crypto.randomUUID()}, ${orderId}, id, ${off.toFixed(2)}::numeric from claimed
          returning id
        `);
        if (claimed.rows.length === 1) {
          remaining -= off;
          notes.push(note);
        }
      }
    }
  }

  if (options.useStoreCredit && remaining > 0.004) {
    let creditUsed = 0;
    // A few passes: if another checkout spends from the same row between our
    // read and our write, the guarded statement below matches nothing and we
    // simply re-read the fresh balances and carry on.
    for (let pass = 0; pass < 3 && remaining > 0.004; pass++) {
      const creditRewards = await db
        .select()
        .from(referralRewards)
        .where(
          and(
            eq(referralRewards.userId, userId),
            eq(referralRewards.type, "store_credit"),
            eq(referralRewards.redeemed, false)
          )
        );
      if (creditRewards.length === 0) break;

      let conflicted = false;
      for (const r of creditRewards) {
        if (remaining <= 0.004) break;
        const balance = parseFloat(r.creditAmount ?? "0");
        const use = roundToCents(Math.min(balance, remaining));
        if (use <= 0) continue;
        const useStr = use.toFixed(2);
        const spent = await db.execute(sql`
          with claimed as (
            update referral_rewards
               set credit_amount = credit_amount - ${useStr}::numeric,
                   redeemed = (credit_amount - ${useStr}::numeric) <= 0,
                   redeemed_at = case when (credit_amount - ${useStr}::numeric) <= 0 then now() else null end
             where id = ${r.id} and user_id = ${userId} and type = 'store_credit'
               and redeemed = false and credit_amount >= ${useStr}::numeric
            returning id
          )
          insert into referral_reward_usages (id, order_id, reward_id, amount_used)
          select ${crypto.randomUUID()}, ${orderId}, id, ${useStr}::numeric from claimed
          returning id
        `);
        if (spent.rows.length === 1) {
          remaining = Math.max(0, remaining - use);
          creditUsed += use;
        } else {
          conflicted = true;
          break; // balances changed under us — re-read and go again
        }
      }
      if (!conflicted) break;
    }
    if (creditUsed > 0) notes.push(`Store credit applied: ${creditUsed.toFixed(2)} ETB`);
  }

  return {
    discountAmount: (subtotal - remaining).toFixed(2),
    note: notes.length ? notes.join(" · ") : null,
  };
}

function roundToCents(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Hands back whatever referral rewards an order consumed — called when an
 * order is cancelled (see applyOrderStatus in lib/orders.ts), whether that
 * was an admin's manual override or the expire-orders cron catching an
 * abandoned/failed checkout that never got paid. Restores each touched
 * reward by the exact amountUsed recorded at redemption time, which stays
 * correct even if other orders have since taken further slices of the same
 * store-credit row. Safe to call more than once for the same order — usage
 * rows already reversed are skipped.
 */
export async function reverseOrderRewardUsages(orderId: string) {
  const usages = await db
    .select({ id: referralRewardUsages.id })
    .from(referralRewardUsages)
    .where(and(eq(referralRewardUsages.orderId, orderId), sql`${referralRewardUsages.reversedAt} is null`));

  for (const usage of usages) {
    // One statement per usage: it marks the usage reversed AND hands the
    // slice back, together or not at all. Only the call that actually flips
    // reversed_at gets to restore anything, so a cron run and an admin
    // cancelling the same order at the same moment can never refund a reward
    // twice. A discount code is simply un-flipped (all-or-nothing); credit
    // vouchers get this order's slice added back onto whatever balance is
    // there now, so a partial spend by another order in the meantime is
    // left untouched.
    await db.execute(sql`
      with reversed as (
        update referral_reward_usages
           set reversed_at = now()
         where id = ${usage.id} and reversed_at is null
        returning reward_id, amount_used
      )
      update referral_rewards r
         set credit_amount = case
               when r.type = 'discount_code' then r.credit_amount
               else coalesce(r.credit_amount, 0) + reversed.amount_used
             end,
             redeemed = false,
             redeemed_at = null
        from reversed
       where r.id = reversed.reward_id
    `);
  }
}
