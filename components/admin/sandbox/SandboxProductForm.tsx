"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";
import type { ProductInput } from "@/app/admin/actions";
import { getSandboxState, useHydrated } from "@/lib/sandbox-store";

/**
 * The product form for a read-only guest. It's the real form, but saving
 * writes to this browser only. It waits until the browser has loaded the
 * guest's earlier edits so the form starts from them.
 *
 *  - productId: editing a real product (starts from the guest's earlier edit
 *    of it if there is one, otherwise the real values in `initial`).
 *  - no productId: a new product; `?local=<id>` re-opens one they made.
 */
function Inner({
  productId,
  initial,
  existingCategories,
}: {
  productId?: string;
  initial?: ProductInput;
  existingCategories: string[];
}) {
  const hydrated = useHydrated();
  const localId = useSearchParams().get("local") ?? undefined;
  if (!hydrated) return <p className="text-sm text-muted-foreground">Loading…</p>;

  const state = getSandboxState();
  const start = productId
    ? (state.products[productId] ?? initial)
    : localId
      ? state.created[localId]
      : undefined;

  return (
    <ProductForm
      key={productId ?? localId ?? "new"}
      sandbox
      productId={productId}
      localId={productId ? undefined : localId}
      initial={start}
      existingCategories={existingCategories}
    />
  );
}

export function SandboxProductForm(props: {
  productId?: string;
  initial?: ProductInput;
  existingCategories: string[];
}) {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
      <Inner {...props} />
    </Suspense>
  );
}
