import { getPendingClaims } from "@/app/dispatcher/actions";
import { DeliveryClaimsQueue } from "@/components/dispatcher/DeliveryClaimsQueue";

export default async function DispatcherClaimsPage() {
  const claims = await getPendingClaims();

  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold">Delivery Claims</h2>
      <p className="mb-6 text-sm text-muted-foreground">
        Drivers submit these as they go, approving advances the order and emails the customer;
        declining flags the driver (3 flags auto-blacklists them) and lets them resubmit.
      </p>
      <DeliveryClaimsQueue claims={claims} />
    </div>
  );
}
