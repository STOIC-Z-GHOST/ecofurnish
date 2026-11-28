import { getUsersForDispatcherManagement } from "@/app/admin/actions";
import { DispatcherManager } from "@/components/admin/DispatcherManager";
import { requireAdminViewPage } from "@/lib/require-admin";
import { DemoDispatchers } from "@/components/admin/demo/DemoAdmin";

export default async function AdminDispatchersPage() {
  const { isGuest } = await requireAdminViewPage("guestDispatchers");
  if (isGuest) return <DemoDispatchers />;
  const users = await getUsersForDispatcherManagement();
  const dispatchers = users.filter((u) => u.role === "dispatcher");
  const candidates = users.filter((u) => u.role !== "dispatcher");

  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold">Dispatchers</h2>
      <p className="mb-6 text-sm text-muted-foreground">
        Dispatchers review driver applications, assign deliveries, and manage the delivery
        pipeline. Promoting someone here is immediate &mdash; they&apos;ll get an email, but
        there&apos;s no accept step. Admin accounts aren&apos;t managed from this page; that
        stays on the CLI.
      </p>
      <DispatcherManager dispatchers={dispatchers} candidates={candidates} />
    </div>
  );
}
