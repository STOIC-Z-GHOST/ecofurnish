import { requireAdminPage } from "@/lib/require-admin";
import { SETTING_DEFS, TEXT_DEFS, getSiteSettings } from "@/lib/site-settings";
import SettingsForm from "@/components/admin/SettingsForm";

export default async function AdminSettingsPage() {
  // Admin only: guests can look at orders and products, but not change how
  // the live site behaves.
  await requireAdminPage();
  const current = await getSiteSettings();

  const initial: Record<string, boolean> = {};
  for (const d of SETTING_DEFS) initial[d.key] = current[d.key];
  const initialTexts: Record<string, string> = {};
  for (const t of TEXT_DEFS) initialTexts[t.key] = current[t.key];

  return (
    <div>
      <h2 className="mb-2 text-lg font-semibold">Settings</h2>
      <p className="mb-6 max-w-2xl text-sm text-muted-foreground">
        Switch parts of the site on and off. Changes apply to every visitor right after you save.
      </p>
      <SettingsForm
        defs={SETTING_DEFS.map((d) => ({ key: d.key, group: d.group, label: d.label, description: d.description }))}
        texts={TEXT_DEFS.map((t) => ({ key: t.key, forSwitch: t.forSwitch, label: t.label, placeholder: t.placeholder, max: t.max }))}
        initial={initial}
        initialTexts={initialTexts}
      />
    </div>
  );
}
