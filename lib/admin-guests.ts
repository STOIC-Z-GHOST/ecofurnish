import { desc } from "drizzle-orm";
import { db } from "@/db";
import { adminGuests } from "@/db/schema";

export interface GuestListRow {
  email: string;
  expiresAt: string; // ISO
  revoked: boolean;
  active: boolean;
}

/** Everyone who has been given guest access, newest first, with whether it's still live. */
export async function listGuests(): Promise<GuestListRow[]> {
  const rows = await db.select().from(adminGuests).orderBy(desc(adminGuests.createdAt));
  const now = Date.now();
  return rows.map((r) => ({
    email: r.email,
    expiresAt: r.expiresAt.toISOString(),
    revoked: r.revokedAt !== null,
    active: r.revokedAt === null && r.expiresAt.getTime() > now,
  }));
}
