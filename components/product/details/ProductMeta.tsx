import ProductPrice from "../ProductPrice";
import ProductRating from "../ProductRating";
import type { Currency } from "@/lib/currency";

interface ProductMetaProps {
  price: string;
  currency?: Currency;
  avgRating?: number | null;
  reviewCount?: number;
  discountPercent?: number | null;
  discountReason?: string | null;
  dealEndsAt?: Date | string | null;
}

export default function ProductMeta({
  price,
  currency = "ETB",
  avgRating,
  reviewCount,
  discountPercent,
  discountReason,
  dealEndsAt,
}: ProductMetaProps) {
  return (
    <div className="space-y-4">
      <ProductPrice
        price={price}
        currency={currency}
        discountPercent={discountPercent}
        discountReason={discountReason}
        dealEndsAt={dealEndsAt}
      />
      {avgRating != null && reviewCount ? (
        <ProductRating rating={avgRating} count={reviewCount} />
      ) : null}
    </div>
  );
}
