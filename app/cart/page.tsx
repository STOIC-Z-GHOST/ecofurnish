"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import { formatPrice, type Currency } from "@/lib/currency";
import { useSession } from "@/lib/auth-client";
import { ExchangeRateNote } from "@/components/currency/ExchangeRateNote";
import { WaitingForRestock } from "@/components/cart/WaitingForRestock";

export default function CartPage() {
  const { items, updateQuantity, removeItem, subtotal } = useCart();
  const { data: session } = useSession();
  const currency = (session?.user?.preferredCurrency as Currency | undefined) || "ETB";

  if (items.length === 0) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-24 text-center">
        <div className="mb-10 text-left">
          <WaitingForRestock />
        </div>
        <ShoppingBag className="mx-auto h-10 w-10 text-muted-foreground" />
        <h1 className="mt-4 text-2xl font-semibold">Your cart is empty</h1>
        <p className="mt-2 text-muted-foreground">
          Browse the catalog and add something you like.
        </p>
        <Button className="mt-6" render={<Link href="/" />} nativeButton={false}>
          Back to shop
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10">
      <h1 className="mb-8 text-3xl font-extrabold tracking-tight">Your Cart</h1>

      <WaitingForRestock />

      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.productId}
            className="flex flex-wrap items-center gap-4 rounded-lg border border-border/60 p-4"
          >
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
              <Image
                src={item.imageUrl || "/placeholder.jpg"}
                alt={item.name}
                fill
                className="object-cover"
                sizes="80px"
              />
            </div>

            <div className="min-w-[140px] flex-1">
              <Link
                href={`/products/${item.productId}`}
                className="line-clamp-1 font-medium hover:underline"
              >
                {item.name}
              </Link>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatPrice(item.price, currency)} each
              </p>
            </div>

            <div className="flex w-full items-center justify-between gap-4 sm:w-auto sm:justify-normal">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center rounded-lg border border-border">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                  <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    aria-label="Increase quantity"
                    disabled={item.quantity >= item.stock}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {/* Keyed on quantity so React remounts it on every +/- click,
                    which is what makes the pop-in animation replay each
                    time instead of only on first render. Decreasing to 0
                    removes the whole item (see updateQuantity in
                    cart-context.tsx), which takes this badge with it —
                    nothing extra needed for it to "disappear". */}
                <span
                  key={item.quantity}
                  className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold whitespace-nowrap text-primary duration-200 animate-in fade-in-0 zoom-in-90"
                >
                  {formatPrice((parseFloat(item.price) * item.quantity).toFixed(2), currency)}
                </span>
              </div>

              <Button
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => removeItem(item.productId)}
                aria-label={`Remove ${item.name}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-col items-end gap-1 border-t border-border/60 pt-6">
        <div className="flex items-baseline gap-3 text-lg">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="text-2xl font-bold text-primary">{formatPrice(subtotal, currency)}</span>
        </div>
        {currency !== "ETB" && (
          <>
            <p className="text-xs text-muted-foreground">
              Shown in {currency} for reference — you&apos;ll be charged in ETB at checkout.
            </p>
            <ExchangeRateNote className="text-xs text-muted-foreground" />
          </>
        )}
        <Button size="lg" className="mt-3" render={<Link href="/checkout" />} nativeButton={false}>
          Proceed to Checkout
        </Button>
      </div>
    </div>
  );
}
