import Link from "next/link";
import { Plus } from "lucide-react";
import { db } from "@/db";
import { products } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/currency";
import { DeleteProductButton } from "@/components/admin/delete-product-button";
import { requireAdminPage } from "@/lib/require-admin";

export default async function AdminProductsPage() {
  await requireAdminPage();
  const allProducts = await db.select().from(products);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Products ({allProducts.length})</h2>
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
            {allProducts.map((p) => (
              <tr key={p.id} className="border-t border-border/60">
                <td className="p-3 font-medium">{p.name}</td>
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
                      render={<Link href={`/admin/products/${p.id}/edit`} />}
                      nativeButton={false}
                    >
                      Edit
                    </Button>
                    <DeleteProductButton productId={p.id} productName={p.name} />
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
