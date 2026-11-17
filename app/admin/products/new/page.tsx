import { db } from "@/db";
import { products } from "@/db/schema";
import { ProductForm } from "@/components/admin/product-form";
import { requireAdminViewPage } from "@/lib/require-admin";
import { SandboxProductForm } from "@/components/admin/sandbox/SandboxProductForm";

export default async function NewProductPage() {
  const { isGuest } = await requireAdminViewPage();
  const rows = await db.selectDistinct({ category: products.category }).from(products);
  const existingCategories = rows.map((r) => r.category).sort();

  return (
    <div>
      <h2 className="mb-6 text-lg font-semibold">New product</h2>
      {isGuest ? (
        <SandboxProductForm existingCategories={existingCategories} />
      ) : (
        <ProductForm existingCategories={existingCategories} />
      )}
    </div>
  );
}
