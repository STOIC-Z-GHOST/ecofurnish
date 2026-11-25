import { toast } from "sonner";
import { Check } from "lucide-react";

/**
 * The "added to cart" toast: product thumbnail with a small green check,
 * styled by the theme (see the sonner rules in app/globals.css). Display
 * only. It does not touch the cart, it just replaces the plain text toast.
 */
export function showCartToast(name: string, imageUrl?: string | null, message?: string) {
  toast.success(message ?? `${name} added to cart`, {
    icon: (
      <span className="relative block size-10 shrink-0 overflow-hidden rounded-md bg-white ring-1 ring-border">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="size-full object-contain" />
        ) : null}
        <span className="absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="size-3" strokeWidth={3} />
        </span>
      </span>
    ),
  });
}
