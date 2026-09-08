import { pgTable, text, numeric, integer, timestamp, boolean, uniqueIndex } from "drizzle-orm/pg-core";

export const products = pgTable("products", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description"),
  // Drizzle handles the numeric prices perfectly
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("image_url"),
  // Extra gallery photos beyond the cover shot above (imageUrl stays the
  // cover/thumbnail everywhere it's already used — cart, wishlist, order
  // snapshots, OG tags — so none of that had to change). Order here is
  // display order on the product page and in the hover/next-photo cycler.
  images: text("images").array().notNull().default([]),
  // Used to group products in the catalog filters (e.g. "Seating", "Storage")
  category: text("category").notNull().default("Other"),
  // Which room(s) this piece suits (e.g. "Living Room", "Bedroom") — kept
  // separate from `category` since it's a different axis (furniture type
  // vs. where it's used) and a product can reasonably belong to more than
  // one room at once, e.g. a modular shelf fitting both a living room and
  // an office.
  rooms: text("rooms").array().notNull().default([]),
  stock: integer("stock").default(0).notNull(),
  // Tracking the environmental impact
  plasticWeightKg: numeric("plastic_weight_kg", { precision: 5, scale: 2 }).default('0.00').notNull(),
  // Optional site-run discount (e.g. a launch promo). 0 = no discount.
  // Manually controlled from the admin product form. By default it runs
  // until whoever's managing the store clears it — but if dealEndsAt is
  // set, the storefront treats it as a flash sale and shows a countdown
  // timer next to the discount until that moment passes.
  discountPercent: integer("discount_percent").default(0).notNull(),
  discountReason: text("discount_reason"),
  dealEndsAt: timestamp("deal_ends_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// One row per checkout. We snapshot the customer's contact details here
// rather than requiring an account, so guest checkout works.
export const orders = pgTable("orders", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  // Always set now that checkout requires an account — left nullable
  // (rather than migrating) since any earlier guest orders still have
  // null here. Not a foreign key: Better Auth manages the `user` table
  // separately from this Drizzle schema.
  userId: text("user_id"),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone").notNull(),
  shippingAddress: text("shipping_address").notNull(),
  city: text("city").notNull(),
  notes: text("notes"),
  // Best-effort browser geolocation, captured silently at checkout if
  // the buyer's device/browser grants it — never required to place an
  // order. When present, this is a far more accurate delivery-pin
  // starting point than geocoding the typed address text, so
  // geocodeOrderAddress (app/dispatcher/actions.ts) prefers these over
  // re-geocoding whenever they're set.
  customerLat: numeric("customer_lat", { precision: 9, scale: 6 }),
  customerLng: numeric("customer_lng", { precision: 9, scale: 6 }),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  // Any referral reward applied at checkout (store credit, or a % code) —
  // kept separate from totalAmount (which is the final charged amount) so
  // there's a record, in the order itself and in admin, of what discount
  // was applied and why.
  discountAmount: numeric("discount_amount", { precision: 10, scale: 2 }).default("0.00").notNull(),
  discountNote: text("discount_note"),
  // pending -> processing -> ready_for_delivery -> on_the_road ->
  // near_destination -> delivered (or cancelled at any point) — see
  // ORDER_STATUSES in lib/orders.ts, the actual source of truth. The
  // three delivery-lifecycle stages are normally driven by the
  // dispatcher approving a driver's claim (see deliveryClaims), not set
  // directly, though the admin panel can still override any status.
  status: text("status").notNull().default("pending"),
  // unpaid until Chapa confirms the transaction server-to-server
  // (see verifyChapaTransaction / confirmPayment)
  paymentStatus: text("payment_status").notNull().default("unpaid"),
  chapaTxRef: text("chapa_tx_ref"),
  // Free-text, e.g. a Telebirr tracking number — set from the admin
  // panel, included in the "shipped" status email if present.
  trackingNote: text("tracking_note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// One row per product in an order. Name and price are copied at order time
// so a later price change or product edit never rewrites past orders.
export const orderItems = pgTable("order_items", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  orderId: text("order_id").notNull().references(() => orders.id),
  productId: text("product_id").notNull().references(() => products.id),
  productName: text("product_name").notNull(),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull(),
});

export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull().unique(),
  subscribedAt: timestamp("subscribed_at").defaultNow().notNull(),
});

// One row per customer per product. Submission is only allowed for users
// with a delivered order containing this product (see canReviewProduct in
// lib/reviews.ts) — so every row here is inherently a verified purchase,
// with nothing extra to store for that. One review per (userId,
// productId) is enforced in the submitReview action itself (check, then
// insert or update) rather than a DB constraint — fine at this store's
// scale, and keeps the migration a plain additive `pnpm db:push`.
export const reviews = pgTable("reviews", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  productId: text("product_id").notNull().references(() => products.id),
  // Not a foreign key — same reasoning as orders.userId above.
  userId: text("user_id").notNull(),
  // Snapshotted at submission time, same reasoning as
  // orderItems.productName — a later display-name change shouldn't
  // rewrite old reviews, and this avoids a live join into Better Auth's
  // user table just to render a name.
  userName: text("user_name").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// One row per user who has ever generated a referral link. Codes are
// created lazily the first time someone visits their referral page —
// not every user has one.
export const referralCodes = pgTable("referral_codes", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().unique(),
  code: text("code").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// One row per person who signed up via someone else's referral link.
// `qualified` flips true the first time that person's first order is
// actually paid for — invites alone never count, only ones who actually
// buy something, per how this was scoped.
export const referrals = pgTable("referrals", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  referrerId: text("referrer_id").notNull(),
  // unique: one person can only ever have been referred by one other person
  referredUserId: text("referred_user_id").notNull().unique(),
  qualified: boolean("qualified").default(false).notNull(),
  qualifiedAt: timestamp("qualified_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// One row per reward a referrer actually earned by crossing a milestone
// (see MILESTONES in lib/referrals.ts). `code` is the redeemable string
// for discount_code / free_shipping types; `creditAmount` is the balance
// for store_credit (and is decremented as it's spent, rather than being
// all-or-nothing against a single order).
export const referralRewards = pgTable(
  "referral_rewards",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id").notNull(),
    type: text("type").notNull(), // "discount_code" | "store_credit" | "free_shipping"
    milestone: integer("milestone").notNull(), // 5, 15, or 30 — which tier earned this
    code: text("code").unique(), // set for discount_code / free_shipping
    percentOff: integer("percent_off"), // set for discount_code
    creditAmount: numeric("credit_amount", { precision: 10, scale: 2 }), // set for store_credit / free_shipping
    redeemed: boolean("redeemed").default(false).notNull(),
    redeemedAt: timestamp("redeemed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    // The application already checks-then-inserts before issuing a reward,
    // but that check and that insert aren't atomic — two referrals
    // qualifying in the same instant could both pass the check before
    // either insert lands. This constraint is what actually stops the
    // second one; qualifyReferralIfFirstPurchase in lib/referrals.ts
    // treats hitting it as "already issued" rather than an error.
    uniqueIndex("referral_rewards_user_milestone_idx").on(table.userId, table.milestone),
  ]
);

// One row per order that consumed some slice of a referral reward
// (promo code or store credit), recorded at redemption time so it can
// be precisely reversed later — see applyReferralRewards and
// reverseOrderRewardUsages in lib/referrals.ts. Cancelling an order
// (whether an admin's manual override or the expire-orders cron
// catching an abandoned checkout) hands back exactly amountUsed rather
// than assuming the reward's full original value, since another order
// may have taken a further slice of the same store-credit reward in
// the meantime.
export const referralRewardUsages = pgTable("referral_reward_usages", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  orderId: text("order_id").notNull().references(() => orders.id),
  rewardId: text("reward_id").notNull().references(() => referralRewards.id),
  amountUsed: numeric("amount_used", { precision: 10, scale: 2 }).notNull(),
  // Set once reverseOrderRewardUsages has restored this slice back onto
  // the reward — null means still active/consumed, not yet reversed.
  reversedAt: timestamp("reversed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// One row per person who submits the driver application form. There is
// no persistent driver account/login — an approved row here doubles as
// the driver's identity for delivery assignment and flag tracking. A
// driver reaches their status portal via a one-time magic link scoped to
// a single assignment (see deliveryAssignments.magicToken below), never
// via sign-in.
export const driverApplications = pgTable("driver_applications", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  city: text("city").notNull(),
  vehicleType: text("vehicle_type").notNull(), // "Bicycle" | "Motorcycle" | "Car" | "On Foot"
  notes: text("notes"),
  // pending -> approved | rejected. An approved row can later gain a
  // blacklistedAt once flagCount below hits the 3-strike threshold.
  status: text("status").notNull().default("pending"),
  // Incremented each time a dispatcher declines one of this driver's
  // delivery claims (see deliveryClaims below). 3 flags auto-blacklists.
  flagCount: integer("flag_count").default(0).notNull(),
  blacklistedAt: timestamp("blacklisted_at"),
  reviewNote: text("review_note"),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// One row per driver assigned to an order's delivery. Created by a
// dispatcher once an order is ready to go out — this is what generates
// the magic link a driver uses to reach their status portal.
export const deliveryAssignments = pgTable("delivery_assignments", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  orderId: text("order_id").notNull().references(() => orders.id),
  driverId: text("driver_id").notNull().references(() => driverApplications.id),
  // active -> completed (once a "delivered" claim is approved), or
  // cancelled if a dispatcher reassigns the order to a different driver
  // mid-delivery.
  status: text("status").notNull().default("active"),
  // Long random bearer token embedded in the driver's status-portal
  // link — scoped to this one assignment only.
  magicToken: text("magic_token").notNull().unique(),
  tokenExpiresAt: timestamp("token_expires_at").notNull(),
  // Delivery target coordinates: started from an auto-geocode of the
  // shipping address, then confirmed/dragged into place by the
  // dispatcher at assignment time. Snapshotted here (not read live off
  // the order) so a later address edit can't shift the target under an
  // in-progress delivery.
  deliveryLat: numeric("delivery_lat", { precision: 9, scale: 6 }).notNull(),
  deliveryLng: numeric("delivery_lng", { precision: 9, scale: 6 }).notNull(),
  // Emailed to the buyer at assignment time. The driver collects this
  // from the buyer in person and enters it to submit a "delivered"
  // claim — the paper trail against false "never received it" disputes.
  buyerPin: text("buyer_pin").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// One row per driver button-press on their status portal (started
// driving / near destination / delivered). Never changes orders.status
// directly — always lands here as "pending" for a dispatcher to approve
// or decline first (see app/dispatcher/actions.ts).
export const deliveryClaims = pgTable("delivery_claims", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  assignmentId: text("assignment_id").notNull().references(() => deliveryAssignments.id),
  claimType: text("claim_type").notNull(), // "started_driving" | "near_destination" | "delivered"
  // One-time location check, captured for "near_destination" and
  // "delivered" claims only — the driver's reported coordinates and
  // their Haversine distance from the assignment's delivery target.
  // Shown to the dispatcher as a verification signal, not an automatic
  // pass/fail gate (GPS accuracy varies too much to hard-block on it).
  driverLat: numeric("driver_lat", { precision: 9, scale: 6 }),
  driverLng: numeric("driver_lng", { precision: 9, scale: 6 }),
  distanceMeters: numeric("distance_meters", { precision: 10, scale: 1 }),
  // Only set for "delivered" claims.
  pinEntered: text("pin_entered"),
  pinMatched: boolean("pin_matched"),
  status: text("status").notNull().default("pending"), // pending | approved | declined
  dispatcherNote: text("dispatcher_note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  reviewedAt: timestamp("reviewed_at"),
});

// One row per person who's ever requested (or been granted) Telegram
// bot access via the self-service flow — see app/api/telegram/webhook
// and lib/telegram-access-requests.ts. The original TELEGRAM_CHAT_ID
// env var (lib/telegram.ts) remains a permanent fallback admin that
// can never be locked out by anything happening here; this table is
// purely for ADDITIONAL admins, added without ever touching Vercel.
export const telegramAdmins = pgTable("telegram_admins", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  chatId: text("chat_id").notNull().unique(),
  label: text("label"), // optional display name, e.g. "Abebe — dispatcher"
  reason: text("reason"), // what they typed when self-requesting access
  // awaiting_reason (tapped "Request Access", hasn't typed a reason
  // yet) -> pending (reason given, awaiting admin review) -> approved
  // | rejected. A manually-added admin (via the /admin/telegram "Add"
  // form) skips straight to "approved" with no reason.
  status: text("status").notNull().default("awaiting_reason"),
  requestedAt: timestamp("requested_at").defaultNow().notNull(),
  reviewedAt: timestamp("reviewed_at"),
});

// Inbound emails to the Resend-managed domain (support@, hello@, etc.),
// landed here by the webhook at app/api/resend/webhook/route.ts. Resend
// itself only keeps these for 30 days, so this is the permanent copy —
// and what the admin inbox page at /admin/inbox actually reads from.
export const inboundEmails = pgTable("inbound_emails", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  // Resend's own email_id — unique constraint makes webhook retries
  // (which Resend does on delivery failure) safe to insert twice.
  resendEmailId: text("resend_email_id").notNull().unique(),
  fromEmail: text("from_email").notNull(),
  toEmail: text("to_email").notNull(),
  subject: text("subject"),
  text: text("text"),
  html: text("html"),
  read: boolean("read").default(false).notNull(),
  receivedAt: timestamp("received_at").defaultNow().notNull(),
});
