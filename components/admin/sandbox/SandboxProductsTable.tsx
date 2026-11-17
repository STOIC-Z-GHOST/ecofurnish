"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/currency";
import { deleteSandboxProduct, useSandbox } from "@/lib/sandbox-store";

export type SandboxProductRow = {
  id: string;
  name: string;
  category: string;
  price: string;
  stock: number;
};

/**
 * The Products list for a read-only guest: the real products, with the
 * guest's own sandbox edits laid over them. Edit opens the real edit form in
 * sandbox mode; Delete only hides the row for them.
 */
export function SandboxProductsTable({ rows }: { rows: SandboxProductRow[] }) {
  const sandbox = useSandbox();

  const merged: (SandboxProductRow & { local: boolean; edited: boolean })[] = [
    ...rows.map((r) => {
      const edit = sandbox.products[r.id];
      return edit
        ? { id: r.id, name: edit.name, category: edit.category, price: edit.price, stock: edit.stock, local: false, edited: true }
        : { ...r, local: false, edited: false };
    }),
    ...Object.entries(sandbox.created).map(([id, p]) => ({
      id,
      name: p.name,
      category: p.category,
      price: p.price,
      stock: p.stock,
      local: true,
      edited: false,
    })),
  ].filter((p) => !sandbox.deleted.includes(p.id));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Products ({merged.length})</h2>
        <Button render={<Link href="/admin/products/new" />} nativeButton={false}>
          <Plus className="h-4 w-4" />
          New product
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border/60">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-muted-foreground">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Category</th>
              <th className="p-3">Price</th>
              <th className="p-3">Stock</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {merged.map((p) => (
              <tr key={p.id} className="border-t border-border/60">
                <td className="p-3 font-medium">
                  {p.name}
                  {(p.local || p.edited) && (
                    <span className="ml-2 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-normal text-amber-700 dark:text-amber-400">
                      {p.local ? "new · only you" : "edited · only you"}
                    </span>
                  )}
                </td>
                <td className="p-3 text-muted-foreground">{p.category}</td>
                <td className="p-3">{formatPrice(p.price, "ETB")}</td>
                <td className="p-3">
                  <span className={p.stock <= 3 ? "text-destructive" : ""}>{p.stock}</span>
                </td>
                <td className="p-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      render={
                        <Link
                          href={
                            p.local
                              ? `/admin/products/new?local=${encodeURIComponent(p.id)}`
                              : `/admin/products/${p.id}/edit`
                          }
                        />
                      }
                      nativeButton={false}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (window.confirm(`Delete "${p.name}"? (Only for you — the real product stays.)`)) {
                          deleteSandboxProduct(p.id);
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
