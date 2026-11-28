import { db } from "@/db";
import { orders, products } from "@/db/schema";
import { formatPrice } from "@/lib/currency";
import { Package, ShoppingBag, TriangleAlert, Wallet } from "lucide-react";
import { requireAdminViewPage } from "@/lib/require-admin";
import { demoDashboard } from "@/lib/demo-data";

export default async function AdminDashboardPage() {
  // Read-only for guests too. A guest gets made-up numbers and the database
  // is never queried for them (see lib/demo-data.ts).
  const { isGuest } = await requireAdminViewPage("guestDashboard");

  let orderCount: number;
  let productCount: number;
  let revenue: number;
  let lowStock: { id: string; name: string; stock: number }[];
  if (isGuest) {
    const demo = demoDashboard();
    ({ orderCount, productCount, revenue, lowStock } = demo);
  } else {
    const [allOrders, allProducts] = await Promise.all([
      db.select().from(orders),
      db.select().from(products),
    ]);
    orderCount = allOrders.length;
    productCount = allProducts.length;
    revenue = allOrders
      .filter((o) => o.paymentStatus === "paid")
      .reduce((sum, o) => sum + parseFloat(o.totalAmount), 0);
    lowStock = allProducts.filter((p) => p.stock <= 3);
  }

  const stats = [
    { label: "Total orders", value: orderCount, icon: ShoppingBag },
    { label: "Revenue", value: formatPrice(revenue.toFixed(2), "ETB"), icon: Wallet },
    { label: "Products", value: productCount, icon: Package },
    { label: "Low stock (≤3)", value: lowStock.length, icon: TriangleAlert },
  ];

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-lg border border-border/60 p-5">
            <Icon className="h-5 w-5 text-muted-foreground" />
            <p className="mt-3 text-2xl font-bold">{value}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {lowStock.length > 0 && (
        <div className="mt-8 rounded-lg border border-border/60 bg-muted/20 p-5">
          <h2 className="font-semibold">Running low</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {lowStock.map((p) => (
              <li key={p.id} className="flex justify-between">
                <span>{p.name}</span>
                <span className="text-muted-foreground">{p.stock} left</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
