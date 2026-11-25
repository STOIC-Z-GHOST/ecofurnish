"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { NAV_HOVER_ICON } from "./nav-hover";

export default function CartButton() {
  const { totalItems } = useCart();

  return (
    <Link href="/cart" aria-label="Shopping Cart" className={`${NAV_HOVER_ICON} p-2`}>
      {/* Keying on totalItems forces React to remount this element whenever
          the cart total changes, which replays the one-shot "animate-in"
          animation, the same visible feedback for +1 as for -1, so it
          also plays on removing an item, not just adding one.
          Prefixed so the icon's key can never collide with the badge's
          key below, both derive from the same totalItems value, and
          sibling elements need distinct keys even when neither is in
          a .map(). */}
      <ShoppingCart
        key={`cart-icon-${totalItems}`}
        className="h-5 w-5 text-foreground animate-in zoom-in-50 duration-300"
      />
      {totalItems > 0 && (
        <span
          key={`cart-badge-${totalItems}`}
          className="absolute -right-1 -top-1 flex h-4.5 min-w-4.5 animate-in zoom-in-50 items-center justify-center rounded-full bg-emerald-700 px-1 text-[10px] font-semibold text-white duration-300"
        >
          {totalItems}
        </span>
      )}
    </Link>
  );
}
