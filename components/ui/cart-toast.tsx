"use client";

import Image from "next/image";
import Link from "next/link";
import { Check } from "lucide-react";
import { toast } from "sonner";

/**
 * The "added to cart" notification: a small card in the current theme with
 * the product thumbnail, a green check, the product name and a link to the
 * cart. Used wherever a product is added, so every add looks the same.
 *
 * It only changes how the confirmation looks. The caller still decides when
 * to show it (after its own add-to-cart logic has run).
 */
export function showCartToast({
  name,
  imageUrl,
  detail = "Added to cart",
}: {
  name: string;
  imageUrl?: string | null;
  detail?: string;
}) {
  toast.custom((id) => (
    <div
      role="status"
      className="pointer-events-auto flex w-[min(92vw,22rem)] items-center gap-3 rounded-xl border border-border bg-popover p-3 text-popover-foreground shadow-lg"
    >
      <div className="relative size-12 shrink-0 rounded-md bg-white ring-1 ring-border">
        <div className="relative size-full overflow-hidden rounded-md">
          <Image
            src={imageUrl || "/placeholder.jpg"}
            alt=""
            fill
            sizes="48px"
            className="object-contain"
          />
        </div>
        <span className="absolute -right-1.5 -bottom-1.5 flex size-5 items-center justify-center rounded-full bg-emerald-700 text-white ring-2 ring-popover">
          <Check className="size-3" strokeWidth={3} aria-hidden="true" />
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm font-medium leading-snug">{name}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>
      </div>
      <Link
        href="/cart"
        onClick={() => toast.dismiss(id)}
        className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-primary hover:bg-muted"
      >
        View cart
      </Link>
    </div>
  ));
}
