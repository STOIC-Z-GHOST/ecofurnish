import { getBroadcastAudienceCounts, getAllCustomers } from "@/app/actions/broadcast";
import { BroadcastForm } from "@/components/admin/BroadcastForm";
import { requireAdminPage } from "@/lib/require-admin";

export default async function AdminBroadcastPage() {
  await requireAdminPage();
  const [counts, customers] = await Promise.all([getBroadcastAudienceCounts(), getAllCustomers()]);

  return (
    <div>
      <h2 className="mb-6 text-lg font-semibold">Broadcast</h2>
      <BroadcastForm counts={counts} customers={customers} />
    </div>
  );
}
