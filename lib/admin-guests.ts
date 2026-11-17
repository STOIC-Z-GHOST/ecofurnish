import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { adminDelegates, adminGuests } from "@/db/schema";

export interface GuestListRow {
  email: string;
  expiresAt: string; // ISO
  revoked: boolean;
  active: boolean;
  /** Who invited them (an access manager's address, or the owner's). */
  grantedBy: string | null;
}

export interface DelegateListRow {
  email: string;
  maxDays: number;
  maxActive: number;
  /** Guests of theirs that are live right now. */
  activeGuests: number;
  revoked: boolean;
}

/**
 * The guest list, newest first, with whether each is still live. Pass
 * `grantedBy` to see only the guests one access manager invited.
 */
export async function listGuests(grantedBy?: string): Promise<GuestListRow[]> {
  const rows = grantedBy
    ? await db
        .select()
        .from(adminGuests)
        .where(eq(adminGuests.grantedBy, grantedBy.toLowerCase()))
        .orderBy(desc(adminGuests.createdAt))
    : await db.select().from(adminGuests).orderBy(desc(adminGuests.createdAt));
  const now = Date.now();
  return rows.map((r) => ({
    email: r.email,
    expiresAt: r.expiresAt.toISOString(),
    revoked: r.revokedAt !== null,
    active: r.revokedAt === null && r.expiresAt.getTime() > now,
    grantedBy: r.grantedBy,
  }));
}

/** Everyone the owner made an access manager, with how many live guests each has. */
export async function listDelegates(guests: GuestListRow[]): Promise<DelegateListRow[]> {
  const rows = await db.select().from(adminDelegates).orderBy(desc(adminDelegates.createdAt));
  return rows.map((d) => ({
    email: d.email,
    maxDays: d.maxDays,
    maxActive: d.maxActive,
    activeGuests: guests.filter((g) => g.active && g.grantedBy === d.email).length,
    revoked: d.revokedAt !== null,
  }));
}
