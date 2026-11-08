"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Leaf } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/types/product";
import { NAV_HOVER_ICON } from "@/components/layout/navbar/nav-hover";
import RestockOverlay from "@/components/product/RestockOverlay";

interface ProductGalleryProps {
  product: Product;
}

export default function ProductGallery({ product }: ProductGalleryProps) {
  // Cover photo first, then the extra gallery photos — one combined list
  // so the arrows/thumbnails don't need to treat the cover specially.
  // Excludes the literal placeholder path too, not just empty values —
  // a brand-new product defaults its cover to /placeholder.jpg until an
  // admin uploads a real one, and without this a product with extra
  // photos added before its cover was set would show that generic
  // placeholder as if it were a real photo in the gallery.
  const photos = [product.imageUrl, ...product.images].filter(
    (src): src is string => !!src && src !== "/placeholder.jpg"
  );
  const displayPhotos = photos.length > 0 ? photos : ["/placeholder.jpg"];
  const [index, setIndex] = useState(0);
  const hasMultiple = displayPhotos.length > 1;

  function next() {
    setIndex((i) => (i + 1) % displayPhotos.length);
  }
  function prev() {
    setIndex((i) => (i - 1 + displayPhotos.length) % displayPhotos.length);
  }

  return (
    <div className="space-y-3">
      <div className="group relative h-64 rounded-2xl sm:h-80 md:h-96 lg:h-[420px]">
        {/* Image clipping lives on its own inner layer now, separate from
            the outer positioning box. The arrows below need to spill their
            glow shadow outward past their own edges — if they shared this
            same overflow-hidden box as the image, that outward glow would
            get cut off right at the rounded corner, since the buttons sit
            close to it (left-3/right-3). Splitting the two lets the image
            still clip to rounded corners while the arrows/dots, as
            children of the outer (non-clipping) box, render freely. */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl bg-muted">
          <Image
            src={displayPhotos[index]}
            alt={product.name}
            fill
            priority
            // object-contain, not object-cover — the box's aspect ratio (a
            // fixed height, but a fluid width) won't usually match a given
            // photo's natural proportions, especially for a tall subject
            // like a tiered plant stand. object-cover would crop to fill
            // that mismatch; object-contain always shows the full photo,
            // letterboxed against bg-muted above if the shapes don't match
            // rather than cutting anything off.
            className="object-contain"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
          <Badge className="absolute left-4 top-4 flex items-center gap-1 bg-emerald-700 text-white hover:bg-emerald-800">
            <Leaf className="h-3 w-3" />
            {product.plasticWeightKg}kg Plastic Diverted
          </Badge>
          {/* Small pill, not a full cover — here people want the big photo. */}
          <RestockOverlay
            productId={product.id}
            stock={product.stock}
            restockAt={product.restockAt}
            variant="badge"
          />
        </div>

        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Previous photo"
              // !absolute, not plain absolute: NAV_HOVER_ICON's own base
              // styling includes `relative` (it needs a positioning
              // context for its own hover effects). Same equal-specificity
              // conflict as the "Back to catalog" button on this same
              // page — Tailwind generates position utilities
              // alphabetically, so plain `relative` would silently win
              // over plain `absolute` in the compiled stylesheet. The `!`
              // forces this absolute to win regardless of that ordering.
              className={`${NAV_HOVER_ICON} !absolute left-3 top-1/2 -translate-y-1/2 p-2 opacity-0 group-hover:opacity-100`}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next photo"
              className={`${NAV_HOVER_ICON} !absolute right-3 top-1/2 -translate-y-1/2 p-2 opacity-0 group-hover:opacity-100`}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
              {displayPhotos.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 w-1.5 rounded-full transition-colors ${
                    i === index ? "bg-white" : "bg-white/50"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {hasMultiple && (
        <div className="flex gap-2.5 overflow-x-auto pb-1">
          {displayPhotos.map((src, i) => (
            <button
              key={src + i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`View photo ${i + 1}`}
              className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-colors sm:h-24 sm:w-24 ${
                i === index ? "border-primary" : "border-transparent"
              }`}
            >
              <Image src={src} alt="" fill className="object-cover" sizes="96px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
