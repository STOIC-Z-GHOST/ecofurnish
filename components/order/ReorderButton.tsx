"use client";

import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";

export interface ReorderItem {
  productId: string;
  variantId?: string | null;
  variantLabel?: string | null;
  name: string;
  price: string;
  imageUrl: string | null;
  stock: number;
  quantity: number;
}

export function ReorderButton({ items }: { items: ReorderItem[] }) {
  const { addItem } = useCart();
  const router = useRouter();

  if (items.length === 0) return null; // every product from this order has since been removed

  function handleReorder() {
    for (const item of items) {
      addItem(
        {
          productId: item.productId,
          variantId: item.variantId ?? null,
          variantLabel: item.variantLabel ?? null,
          name: item.name,
          price: item.price,
          imageUrl: item.imageUrl,
          stock: item.stock,
        },
        item.quantity
      );
    }
    toast.success("Added to cart");
    router.push("/cart");
  }

  return (
    <Button variant="outline" onClick={handleReorder} className="gap-2">
      <RotateCcw className="h-4 w-4" />
      Reorder
    </Button>
  );
}
