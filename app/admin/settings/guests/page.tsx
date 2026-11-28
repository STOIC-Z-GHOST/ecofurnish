import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdminPage } from "@/lib/require-admin";
import { GUEST_GROUP, SETTING_DEFS, getSiteSettings } from "@/lib/site-settings";
import SettingsForm from "@/components/admin/SettingsForm";

export default async function GuestSettingsPage() {
  // Real admins only: a guest must never see (or change) what guests may open.
  await requireAdminPage();
  const current = await getSiteSettings();

  const defs = SETTING_DEFS.filter((d) => d.group === GUEST_GROUP);
  const initial: Record<string, boolean> = {};
  for (const d of defs) initial[d.key] = current[d.key];

  return (
    <div>
      <Link
        href="/admin/settings"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Settings
      </Link>
      <h2 className="mb-2 text-lg font-semibold">Guest settings</h2>
      <p className="mb-6 max-w-2xl text-sm text-muted-foreground">
        Choose which admin pages a temporary read-only guest can open. Guests only ever see
        made-up sample data, and anything they try stays on their own screen. A page that is
        switched off shows &quot;Page not found&quot; to guests.
      </p>
      <SettingsForm
        defs={defs.map((d) => ({ key: d.key, group: "Pages guests can open", label: d.label, description: d.description }))}
        texts={[]}
        initial={initial}
        initialTexts={{}}
      />
    </div>
  );
}
