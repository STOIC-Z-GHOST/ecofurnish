import { requireAdminPage } from "@/lib/require-admin";
import { listGuests } from "@/lib/admin-guests";
import { GuestAccessManager, type GuestRow } from "@/components/admin/guest-access-manager";

export default async function AdminGuestsPage() {
  // Admin only — guests must never be able to manage guests.
  await requireAdminPage();

  let guests: GuestRow[] = [];
  let setupNeeded = false;
  try {
    guests = await listGuests();
  } catch (error) {
    console.error("Couldn't load guest access list:", error);
    setupNeeded = true;
  }

  return (
    <div>
      <h2 className="mb-6 text-lg font-semibold">Guest access</h2>
      {setupNeeded ? (
        <p className="rounded-lg border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
          The <code>admin_guests</code> table doesn&apos;t exist in the database yet. Run
          <code> batch-b-run-in-neon-first.sql</code> in the Neon SQL editor, then reload this page.
        </p>
      ) : (
        <GuestAccessManager guests={guests} />
      )}
    </div>
  );
}
