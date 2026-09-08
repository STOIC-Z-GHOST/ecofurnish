"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { put } from "@vercel/blob";
import { db } from "@/db";
import { products, orders, inboundEmails } from "@/db/schema";
import { requireAdmin } from "@/lib/require-admin";
import { sendAdminMessage, sendDispatcherPromotedEmail, sendDispatcherRemovedEmail } from "@/lib/email";
import { applyOrderStatus } from "@/lib/orders";

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
    return { success: false as const, error: "Image is too large — please keep it under 4MB." };
  }

  try {
    const blob = await put(`products/${file.name}`, file, {
      access: "public",
      addRandomSuffix: true,
    });
    return { success: true as const, url: blob.url };
  } catch (err) {
    console.error("Product image upload failed:", err);
    return { success: false as const, error: "Upload failed — please try again." };
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
  discountPercent: number;
  discountReason: string;
  // ISO string from the admin form's datetime-local input, or null to run
  // the discount with no scheduled end. Converted to a Date right before
  // it hits the DB — see createProduct/updateProduct below.
  dealEndsAt: string | null;
}

function validateProductInput(input: ProductInput) {
  if (!input.name.trim()) throw new Error("Name is required.");
  if (!input.category.trim()) throw new Error("Category is required.");
  const price = parseFloat(input.price);
  if (!Number.isFinite(price) || price < 0) {
    throw new Error("Price must be a valid, non-negative number.");
  }
  if (!Number.isInteger(input.stock) || input.stock < 0) {
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
  // Cover photo + up to 7 extra = 8 total, which is plenty for a product
  // gallery and keeps the admin form and hover-cycler from getting unwieldy.
  if (input.images.length > 7) {
    throw new Error("You can add up to 7 extra photos on top of the cover photo.");
  }
}

export async function createProduct(input: ProductInput) {
  await requireAdmin();
  validateProductInput(input);
  const { dealEndsAt, ...rest } = input;
  await db.insert(products).values({
    ...rest,
    dealEndsAt: dealEndsAt ? new Date(dealEndsAt) : null,
  });
  revalidatePath("/admin/products");
  revalidatePath("/");
}

export async function updateProduct(id: string, input: ProductInput) {
  await requireAdmin();
  validateProductInput(input);
  const { dealEndsAt, ...rest } = input;
  await db
    .update(products)
    .set({
      ...rest,
      dealEndsAt: dealEndsAt ? new Date(dealEndsAt) : null,
      updatedAt: new Date(),
    })
    .where(eq(products.id, id));
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
