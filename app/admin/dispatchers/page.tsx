import { getUsersForDispatcherManagement } from "@/app/admin/actions";
import { DispatcherManager } from "@/components/admin/DispatcherManager";
import { requireAdminPage } from "@/lib/require-admin";

export default async function AdminDispatchersPage() {
  await requireAdminPage();
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
