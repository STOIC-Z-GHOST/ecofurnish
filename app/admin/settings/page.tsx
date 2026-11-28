import { requireAdminViewPage } from "@/lib/require-admin";
import { demoSettings } from "@/lib/demo-data";
import { GUEST_GROUP, SETTING_DEFS, TEXT_DEFS, getSiteSettings } from "@/lib/site-settings";
import SettingsForm from "@/components/admin/SettingsForm";

export default async function AdminSettingsPage() {
  // Admins, plus guests when the owner has switched on "Settings" under
  // Guest admin access. For a guest this is a demo: nothing is ever saved.
  const { isGuest } = await requireAdminViewPage("guestSettings");
  // A guest sees built-in sample values, never the real switches.
  const current = isGuest ? demoSettings() : await getSiteSettings();

  // The guest switches live on their own page (Settings > Guest settings), so
  // they are left out here. A guest never sees them at all.
  const mainDefs = SETTING_DEFS.filter((d) => d.group !== GUEST_GROUP);
  const guestDefs = SETTING_DEFS.filter((d) => d.group === GUEST_GROUP);

  const initial: Record<string, boolean> = {};
  for (const d of mainDefs) initial[d.key] = current[d.key];
  const initialTexts: Record<string, string> = {};
  for (const t of TEXT_DEFS) initialTexts[t.key] = current[t.key];

  return (
    <div>
      <h2 className="mb-2 text-lg font-semibold">Settings</h2>
      <p className="mb-6 max-w-2xl text-sm text-muted-foreground">
        {isGuest
          ? "You can try these switches, but nothing you change here is saved. The real site is not affected."
          : "Switch parts of the site on and off. Changes apply to every visitor right after you save."}
      </p>
      <SettingsForm
        defs={mainDefs.map((d) => ({ key: d.key, group: d.group, label: d.label, description: d.description }))}
        texts={TEXT_DEFS.map((t) => ({ key: t.key, forSwitch: t.forSwitch, label: t.label, placeholder: t.placeholder, max: t.max }))}
        initial={initial}
        initialTexts={initialTexts}
        demo={isGuest}
        guestLink={
          isGuest
            ? undefined
            : { count: guestDefs.filter((d) => current[d.key]).length, total: guestDefs.length }
        }
      />
    </div>
  );
}
