"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWishlist } from "@/lib/wishlist-context";
import { useCart } from "@/lib/cart-context";
import { formatPrice, type Currency } from "@/lib/currency";
import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";

export default function WishlistPage() {
  const { items, removeItem } = useWishlist();
  const { addItem } = useCart();
  const { data: session } = useSession();
  const currency = (session?.user?.preferredCurrency as Currency | undefined) || "ETB";

  if (items.length === 0) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-24 text-center">
        <Heart className="mx-auto h-10 w-10 text-muted-foreground" />
        <h1 className="mt-4 text-2xl font-semibold">Your wishlist is empty</h1>
        <p className="mt-2 text-muted-foreground">
          Tap the heart on anything you like to save it here.
        </p>
        <Button className="mt-6" render={<Link href="/" />} nativeButton={false}>
          Back to shop
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10">
      <h1 className="mb-8 text-3xl font-extrabold tracking-tight">Your Wishlist</h1>

      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.productId}
            className="flex flex-wrap items-center gap-4 rounded-lg border border-border/60 p-4"
          >
            <Link
              href={`/products/${item.productId}`}
              className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-muted"
            >
              <Image
                src={item.imageUrl || "/placeholder.jpg"}
                alt={item.name}
                fill
                className="object-cover"
                sizes="80px"
              />
            </Link>

            <div className="min-w-[140px] flex-1">
              <Link
                href={`/products/${item.productId}`}
                className="line-clamp-1 font-medium hover:underline"
              >
                {item.name}
              </Link>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatPrice(item.price, currency)}
              </p>
            </div>

            <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-normal">
              {item.hasVariants ? (
                <Button variant="outline" size="sm" render={<Link href={`/products/${item.productId}`} />} nativeButton={false}>
                  <ShoppingCart className="h-4 w-4" />
                  Choose options
                </Button>
              ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  addItem({
                    productId: item.productId,
                    name: item.name,
                    price: item.price,
                    imageUrl: item.imageUrl,
                    stock: 99, // wishlist doesn't track live stock — checkout still enforces real limits
                  });
                  toast.success(`${item.name} added to cart`);
                }}
              >
                <ShoppingCart className="h-4 w-4" />
                Add to Cart
              </Button>
              )}

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
    </div>
  );
}
