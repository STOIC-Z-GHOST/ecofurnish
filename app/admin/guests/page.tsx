import { getAdminAccess, requireAdminViewPage, requireGuestManagerPage } from "@/lib/require-admin";
import { DemoGuests } from "@/components/admin/demo/DemoAdmin";
import { listDelegates, listGuests } from "@/lib/admin-guests";
import { GuestAccessManager, type GuestRow } from "@/components/admin/guest-access-manager";
import { AccessManagersPanel, type ManagerRow } from "@/components/admin/access-managers-panel";

export default async function AdminGuestsPage() {
  // A plain guest (not an access manager) can look at a made-up version of
  // this screen when the owner has switched it on.
  const access = await getAdminAccess();
  if (access?.level === "guest" && !access.delegate) {
    await requireAdminViewPage("guestGuests");
    return <DemoGuests />;
  }

  // The owner, or an access manager the owner appointed. Everyone else —
  // including ordinary guests — gets "Page not found".
  const { session, isAdmin, delegate } = await requireGuestManagerPage();

  let guests: GuestRow[] = [];
  let setupNeeded = false;
  try {
    // An access manager only ever sees the guests THEY invited.
    guests = await listGuests(isAdmin ? undefined : session.user.email);
  } catch (error) {
    console.error("Couldn't load guest access list:", error);
    setupNeeded = true;
  }

  let managers: ManagerRow[] = [];
  let managersSetupNeeded = false;
  if (isAdmin) {
    try {
      managers = await listDelegates(guests);
    } catch (error) {
      console.error("Couldn't load access managers:", error);
      managersSetupNeeded = true;
    }
  }

  const limitsNote =
    !isAdmin && delegate
      ? `You can invite up to ${delegate.maxActive} guest(s) at a time, each for up to ${delegate.maxDays} day(s). The owner is notified of every invite.`
      : undefined;

  return (
    <div className="space-y-8">
      <h2 className="text-lg font-semibold">Guest access</h2>
      {setupNeeded ? (
        <p className="rounded-lg border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
          The <code>admin_guests</code> table doesn&apos;t exist in the database yet. Run{" "}
          <code>batch-b-run-in-neon-first.sql</code> in the Neon SQL editor, then reload this page.
        </p>
      ) : (
        <GuestAccessManager
          guests={guests}
          maxDays={isAdmin ? 30 : (delegate?.maxDays ?? 1)}
          showInvitedBy={isAdmin}
          limitsNote={limitsNote}
        />
      )}
      {isAdmin && <AccessManagersPanel managers={managers} setupNeeded={managersSetupNeeded} />}
    </div>
  );
}
