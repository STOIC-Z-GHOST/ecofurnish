"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { requireAdmin } from "@/lib/require-admin";
import { SETTING_DEFS } from "@/lib/site-settings";

type Result = { success: true } | { success: false; error: string };

export async function saveSiteSettings(values: Record<string, boolean>): Promise<Result> {
  // Real admins only. Read-only guests can't reach this.
  const session = await requireAdmin();
  const by = session.user.email ?? session.user.id;

  try {
    for (const def of SETTING_DEFS) {
      if (typeof values[def.key] !== "boolean") continue;
      const value = values[def.key] ? "true" : "false";
      await db
        .insert(siteSettings)
        .values({ key: def.key, value, updatedBy: by })
        .onConflictDoUpdate({
          target: siteSettings.key,
          set: { value, updatedAt: new Date(), updatedBy: by },
        });
    }
  } catch (error) {
    console.error("Couldn't save the site settings:", error);
    return {
      success: false,
      error:
        "Couldn't save. Has the site_settings table been created in the database? (Run batch-f-run-in-neon-first.sql.)",
    };
  }

  // The switches affect the layout, the homepage and the footer.
  revalidatePath("/", "layout");
  return { success: true };
}
