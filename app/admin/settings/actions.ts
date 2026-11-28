"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { requireAdmin } from "@/lib/require-admin";
import { SETTING_DEFS, TEXT_DEFS } from "@/lib/site-settings";

type Result = { success: true } | { success: false; error: string };

export async function saveSiteSettings(
  values: Record<string, boolean>,
  texts: Record<string, string>
): Promise<Result> {
  // Real admins only. Read-only guests can't reach this.
  const session = await requireAdmin();
  const by = session.user.email ?? session.user.id;

  const rows: { key: string; value: string }[] = [];
  for (const def of SETTING_DEFS) {
    if (typeof values?.[def.key] === "boolean") {
      rows.push({ key: def.key, value: values[def.key] ? "true" : "false" });
    }
  }
  for (const def of TEXT_DEFS) {
    const raw = texts?.[def.key];
    if (typeof raw === "string") rows.push({ key: def.key, value: raw.trim().slice(0, def.max) });
  }

  try {
    for (const row of rows) {
      await db
        .insert(siteSettings)
        .values({ ...row, updatedBy: by })
        .onConflictDoUpdate({
          target: siteSettings.key,
          set: { value: row.value, updatedAt: new Date(), updatedBy: by },
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

  // The switches affect the layout, the homepage, the footer and checkout.
  revalidatePath("/", "layout");
  return { success: true };
}
