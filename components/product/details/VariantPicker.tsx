"use client";

import Image from "next/image";
import { Check } from "lucide-react";
import type { ProductVariant } from "@/lib/variant-utils";
import { cn } from "@/lib/utils";

export interface VariantSelection {
  color: string;
  size: string;
}

interface VariantPickerProps {
  variants: ProductVariant[];
  colors: string[];
  sizes: string[];
  selection: VariantSelection;
  onChange: (next: VariantSelection) => void;
  /** Stock to show per variant id (already adjusted for this browser's demo purchases). */
  stocks: Record<string, number>;
}

/**
 * Color and size buttons for a product that comes in options. Nothing is
 * pre-selected (unless there's only one choice), so nobody can add the wrong
 * variant by accident. An option that is sold out — or doesn't exist in the
 * combination chosen so far — is greyed out and can't be picked.
 */
export default function VariantPicker({ variants, colors, sizes, selection, onChange, stocks }: VariantPickerProps) {
  const inStock = (v: ProductVariant) => (stocks[v.id] ?? v.stock) > 0;

  function colorAvailable(color: string) {
    return variants.some((v) => v.color === color && (!selection.size || v.size === selection.size) && inStock(v));
  }
  function sizeAvailable(size: string) {
    return variants.some((v) => v.size === size && (!selection.color || v.color === selection.color) && inStock(v));
  }

  function pickColor(color: string) {
    // Keep the chosen size only if it still exists (and is in stock) in this color.
    const keepSize =
      selection.size &&
      variants.some((v) => v.color === color && v.size === selection.size && inStock(v));
    onChange({ color, size: keepSize ? selection.size : "" });
  }
  function pickSize(size: string) {
    const keepColor =
      selection.color &&
      variants.some((v) => v.size === size && v.color === selection.color && inStock(v));
    onChange({ color: keepColor ? selection.color : "", size });
  }

  return (
    <div className="space-y-5">
      {colors.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">
            Color: <span className="font-normal text-muted-foreground">{selection.color || "choose one"}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {colors.map((color) => {
              const photo = variants.find((v) => v.color === color && v.imageUrl)?.imageUrl ?? null;
              const available = colorAvailable(color);
              const selected = selection.color === color;
              return (
                <button
                  key={color}
                  type="button"
                  disabled={!available}
                  onClick={() => pickColor(color)}
                  aria-pressed={selected}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
                    selected ? "border-primary bg-primary/10 font-medium" : "border-border hover:border-primary/60",
                    !available && "cursor-not-allowed opacity-40 line-through"
                  )}
                >
                  {photo && (
                    <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-md bg-muted">
                      <Image src={photo} alt="" fill className="object-cover" sizes="32px" />
                    </span>
                  )}
                  {color}
                  {selected && <Check className="h-3.5 w-3.5 text-primary" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {sizes.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">
            Size: <span className="font-normal text-muted-foreground">{selection.size || "choose one"}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {sizes.map((size) => {
              const available = sizeAvailable(size);
              const selected = selection.size === size;
              return (
                <button
                  key={size}
                  type="button"
                  disabled={!available}
                  onClick={() => pickSize(size)}
                  aria-pressed={selected}
                  className={cn(
                    "rounded-lg border px-3.5 py-2 text-sm transition-colors",
                    selected ? "border-primary bg-primary/10 font-medium" : "border-border hover:border-primary/60",
                    !available && "cursor-not-allowed opacity-40 line-through"
                  )}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
