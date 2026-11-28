import { getBroadcastAudienceCounts, getAllCustomers } from "@/app/actions/broadcast";
import { BroadcastForm } from "@/components/admin/BroadcastForm";
import { requireAdminViewPage } from "@/lib/require-admin";
import { DemoBroadcast } from "@/components/admin/demo/DemoAdmin";

export default async function AdminBroadcastPage() {
  const { isGuest } = await requireAdminViewPage("guestBroadcast");
  if (isGuest) return <DemoBroadcast />;
  const [counts, customers] = await Promise.all([getBroadcastAudienceCounts(), getAllCustomers()]);

  return (
    <div>
      <h2 className="mb-6 text-lg font-semibold">Broadcast</h2>
      <BroadcastForm counts={counts} customers={customers} />
    </div>
  );
}
