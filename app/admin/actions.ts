"use server";

import { and, eq, notInArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { put } from "@vercel/blob";
import { db } from "@/db";
import { products, productVariants, orders, inboundEmails } from "@/db/schema";
import { requireAdmin } from "@/lib/require-admin";
import { sendAdminMessage, sendDispatcherPromotedEmail, sendDispatcherRemovedEmail } from "@/lib/email";
import { applyOrderStatus } from "@/lib/orders";
import { sweepWaitingOrders } from "@/lib/stock";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // stay comfortably under Vercel's 4.5MB server-upload cap

export async function uploadProductImage(formData: FormData) {
  await requireAdmin();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { success: false as const, error: "No file selected." };
  }
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { success: false as const, error: "Please upload a JPEG, PNG, or WebP image." };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { success: false as const, error: "Image is too large, please keep it under 4MB." };
  }

  try {
    const blob = await put(`products/${file.name}`, file, {
      access: "public",
      addRandomSuffix: true,
    });
    return { success: true as const, url: blob.url };
  } catch (err) {
    console.error("Product image upload failed:", err);
    return { success: false as const, error: "Upload failed, please try again." };
  }
}

export interface ProductInput {
  name: string;
  description: string;
  price: string;
  imageUrl: string;
  images: string[];
  category: string;
  rooms: string[];
  stock: number;
  plasticWeightKg: string;
  // Show in the homepage "Featured products" row.
  featured?: boolean;
  discountPercent: number;
  discountReason: string;
  // ISO string from the admin form's datetime-local input, or null to run
  // the discount with no scheduled end. Converted to a Date right before
  // it hits the DB — see createProduct/updateProduct below.
  dealEndsAt: string | null;
  // ISO string from the form's datetime-local input, or null/omitted for
  // "no restock countdown". Converted to a Date before it hits the DB.
  restockAt?: string | null;
  // The colors/sizes this product comes in, each with its own stock, small
  // price difference and photo. Empty/omitted = a plain product.
  variants?: VariantInput[];
}

export interface VariantInput {
  /** Present for an option that already exists, so editing keeps its identity. */
  id?: string;
  color: string;
  size: string;
  /** Added to the product price; may be negative. A decimal string. */
  priceDelta: string;
  stock: number;
  imageUrl: string | null;
}

const MAX_VARIANTS = 50;

function validateVariants(input: ProductInput) {
  const variants = input.variants ?? [];
  if (variants.length === 0) return;
  if (variants.length > MAX_VARIANTS) throw new Error(`A product can have up to ${MAX_VARIANTS} options.`);
  const basePrice = parseFloat(input.price);
  const seen = new Set<string>();
  for (const v of variants) {
    const color = v.color.trim();
    const size = v.size.trim();
    if (!color && !size) throw new Error("Every option needs a color or a size.");
    if (color.length > 40 || size.length > 40) throw new Error("Color and size names must be 40 characters or fewer.");
    if (!Number.isInteger(v.stock) || v.stock < 0) throw new Error(`Stock for ${[color, size].filter(Boolean).join(" / ")} must be a non-negative whole number.`);
    const delta = parseFloat(v.priceDelta);
    if (!Number.isFinite(delta) || Math.abs(delta) > 1_000_000) throw new Error("Each price difference must be a number (it can be negative).");
    if (!(basePrice + delta > 0)) throw new Error(`The price for ${[color, size].filter(Boolean).join(" / ")} would be zero or negative.`);
    if (v.imageUrl && !(v.imageUrl.startsWith("https://") || v.imageUrl.startsWith("/")) || (v.imageUrl?.length ?? 0) > 2000) {
      throw new Error("An option's photo must be an uploaded image.");
    }
    const key = `${color.toLowerCase()}|${size.toLowerCase()}`;
    if (seen.has(key)) throw new Error(`"${[color, size].filter(Boolean).join(" / ")}" is listed twice.`);
    seen.add(key);
  }
  // The buyer picks each kind of option in turn, so a product must use the
  // same kinds on every row (all with a color, or none; all with a size, or none).
  const everyHasColor = variants.every((v) => v.color.trim());
  const noneHasColor = variants.every((v) => !v.color.trim());
  const everyHasSize = variants.every((v) => v.size.trim());
  const noneHasSize = variants.every((v) => !v.size.trim());
  if (!(everyHasColor || noneHasColor) || !(everyHasSize || noneHasSize)) {
    throw new Error("Fill in the color on every option or on none, and the same for size.");
  }
}

function variantRows(productId: string, input: ProductInput) {
  return (input.variants ?? []).map((v, index) => ({
    id: v.id || crypto.randomUUID(),
    productId,
    color: v.color.trim(),
    size: v.size.trim(),
    priceDelta: parseFloat(v.priceDelta).toFixed(2),
    stock: v.stock,
    imageUrl: v.imageUrl || null,
    sortOrder: index,
  }));
}

function validateProductInput(input: ProductInput) {
  if (!input.name.trim()) throw new Error("Name is required.");
  if (!input.category.trim()) throw new Error("Category is required.");
  const price = parseFloat(input.price);
  if (!Number.isFinite(price) || price < 0) {
    throw new Error("Price must be a valid, non-negative number.");
  }
  // With colors/sizes the product's stock is the total of its options, worked
  // out below — only a plain product's own stock figure matters here.
  if (!input.variants?.length && (!Number.isInteger(input.stock) || input.stock < 0)) {
    throw new Error("Stock must be a non-negative whole number.");
  }
  // The HTML max=99 on the form input is a UI hint only — a request
  // straight to this action (or a typo like "150") would otherwise sail
  // through and, via getEffectivePrice's formula, produce a negative
  // price that flows straight into what Chapa actually charges.
  if (
    !Number.isInteger(input.discountPercent) ||
    input.discountPercent < 0 ||
    input.discountPercent > 99
  ) {
    throw new Error("Discount must be a whole number between 0 and 99.");
  }
  if (input.dealEndsAt && Number.isNaN(new Date(input.dealEndsAt).getTime())) {
    throw new Error("Flash sale end time isn't a valid date.");
  }
  if (input.restockAt && Number.isNaN(new Date(input.restockAt).getTime())) {
    throw new Error("Restock time isn't a valid date.");
  }
  // Cover photo + up to 7 extra = 8 total, which is plenty for a product
  // gallery and keeps the admin form and hover-cycler from getting unwieldy.
  if (input.images.length > 7) {
    throw new Error("You can add up to 7 extra photos on top of the cover photo.");
  }
  validateVariants(input);
}

export async function createProduct(input: ProductInput) {
  await requireAdmin();
  validateProductInput(input);
  const { dealEndsAt, restockAt, variants: _variants, ...rest } = input;
  void _variants;
  const id = crypto.randomUUID();
  const rows = variantRows(id, input);
  const productInsert = db.insert(products).values({
    ...rest,
    id,
    // A product with options sells from the options; its own stock is their total.
    stock: rows.length > 0 ? rows.reduce((n, r) => n + r.stock, 0) : input.stock,
    hasVariants: rows.length > 0,
    dealEndsAt: dealEndsAt ? new Date(dealEndsAt) : null,
    restockAt: restockAt ? new Date(restockAt) : null,
  });
  // One atomic batch: the product and its options are saved together or not at all.
  if (rows.length > 0) {
    await db.batch([productInsert, db.insert(productVariants).values(rows)]);
  } else {
    await productInsert;
  }
  revalidatePath("/admin/products");
  revalidatePath("/");
}

export async function updateProduct(id: string, input: ProductInput) {
  await requireAdmin();
  validateProductInput(input);
  const { dealEndsAt, restockAt, variants: _variants, ...rest } = input;
  void _variants;
  const rows = variantRows(id, input);
  const stock = rows.length > 0 ? rows.reduce((n, r) => n + r.stock, 0) : input.stock;
  const productUpdate = db
    .update(products)
    .set({
      ...rest,
      stock,
      hasVariants: rows.length > 0,
      dealEndsAt: dealEndsAt ? new Date(dealEndsAt) : null,
      restockAt: restockAt ? new Date(restockAt) : null,
      updatedAt: new Date(),
    })
    .where(eq(products.id, id));

  // Options that were removed in the form go; the rest are updated in place
  // (same ids, so carts and past orders still point at them) and new ones are
  // added — all in one atomic batch together with the product itself.
  const removeMissing =
    rows.length > 0
      ? db
          .delete(productVariants)
          .where(and(eq(productVariants.productId, id), notInArray(productVariants.id, rows.map((r) => r.id))))
      : db.delete(productVariants).where(eq(productVariants.productId, id));
  if (rows.length > 0) {
    const upsert = db
      .insert(productVariants)
      .values(rows)
      .onConflictDoUpdate({
        target: productVariants.id,
        set: {
          color: sql`excluded.color`,
          size: sql`excluded.size`,
          priceDelta: sql`excluded.price_delta`,
          stock: sql`excluded.stock`,
          imageUrl: sql`excluded.image_url`,
          sortOrder: sql`excluded.sort_order`,
        },
        // Never let an id that belongs to some OTHER product be overwritten.
        setWhere: eq(productVariants.productId, id),
      });
    await db.batch([productUpdate, removeMissing, upsert]);
  } else {
    await db.batch([productUpdate, removeMissing]);
  }
  // A manual restock should also confirm orders whose customers are waiting.
  if (stock > 0) await sweepWaitingOrders();
  revalidatePath("/admin/products");
  revalidatePath("/");
  revalidatePath(`/products/${id}`);
}

export async function deleteProduct(id: string) {
  await requireAdmin();
  await db.delete(products).where(eq(products.id, id));
  revalidatePath("/admin/products");
  revalidatePath("/");
}

// This is a manual override — normal delivery-lifecycle transitions
// (ready_for_delivery -> ... -> delivered) are meant to happen through a
// dispatcher approving a driver's claim instead (see
// app/dispatcher/actions.ts), which calls the same applyOrderStatus core.
export async function updateOrderStatus(orderId: string, status: string) {
  await requireAdmin();
  await applyOrderStatus(orderId, status);

  revalidatePath("/admin/orders");
  revalidatePath(`/order-confirmation/${orderId}`);
  revalidatePath("/account/orders");
}

export async function updateOrderTrackingNote(orderId: string, trackingNote: string) {
  await requireAdmin();
  await db
    .update(orders)
    .set({ trackingNote: trackingNote.trim() || null })
    .where(eq(orders.id, orderId));
  revalidatePath("/admin/orders");
  revalidatePath(`/order-confirmation/${orderId}`);
}

export async function markInboundEmailRead(id: string, read: boolean) {
  await requireAdmin();
  await db.update(inboundEmails).set({ read }).where(eq(inboundEmails.id, id));
  revalidatePath("/admin/inbox");
}

export async function sendInboxReply(inboundEmailId: string, body: string) {
  await requireAdmin();
  if (!body.trim()) return { success: false as const, error: "Reply can't be empty." };

  const [email] = await db
    .select()
    .from(inboundEmails)
    .where(eq(inboundEmails.id, inboundEmailId));
  if (!email) return { success: false as const, error: "Original email not found." };

  // Avoids "Re: Re: Re: ..." piling up if this thread's already been
  // replied to before.
  const subject = email.subject?.trim().toLowerCase().startsWith("re:")
    ? email.subject
    : `Re: ${email.subject || "(no subject)"}`;

  return sendAdminMessage(email.fromEmail, subject!, body);
}

// Better Auth manages the "user" table itself (outside db/schema.ts), so
// this queries it directly by name rather than through a Drizzle table
// object — same reasoning as getAllCustomerEmails in app/actions/broadcast.ts.
export type DispatcherCandidate = {
  id: string;
  name: string;
  email: string;
  role: string | null;
};

// Deliberately excludes admins — promoting/demoting an admin isn't
// something this UI should be able to do at all (that stays on the
// `pnpm make-admin` CLI, a higher-friction path on purpose for the most
// powerful role). This only ever surfaces "user" <-> "dispatcher".
export async function getUsersForDispatcherManagement() {
  await requireAdmin();
  const result = await db.execute<DispatcherCandidate>(
    sql`SELECT id, name, email, role FROM "user" WHERE email IS NOT NULL AND role IS DISTINCT FROM 'admin' ORDER BY name`
  );
  return result.rows;
}

export async function promoteToDispatcher(userId: string) {
  await requireAdmin();
  // The role guard here (only "user" or null) is what actually stops
  // this from ever touching an admin account, even if the page's own
  // filtering were somehow bypassed.
  const result = await db.execute<DispatcherCandidate>(
    sql`UPDATE "user" SET role = 'dispatcher' WHERE id = ${userId} AND (role IS NULL OR role = 'user') RETURNING id, name, email, role`
  );
  const user = result.rows[0];
  if (!user) throw new Error("User not found, or already has a different role.");

  await sendDispatcherPromotedEmail(user.email, user.name);
  revalidatePath("/admin/dispatchers");
}

export async function removeDispatcherRole(userId: string) {
  await requireAdmin();
  const result = await db.execute<DispatcherCandidate>(
    sql`UPDATE "user" SET role = 'user' WHERE id = ${userId} AND role = 'dispatcher' RETURNING id, name, email, role`
  );
  const user = result.rows[0];
  if (!user) throw new Error("User not found, or isn't currently a dispatcher.");

  await sendDispatcherRemovedEmail(user.email, user.name);
  revalidatePath("/admin/dispatchers");
}
