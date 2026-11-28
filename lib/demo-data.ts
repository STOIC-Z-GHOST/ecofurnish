import type { ProductInput } from "@/app/admin/actions";
import { SETTING_DEFS, TEXT_DEFS, type SiteSettings } from "@/lib/site-settings";

/**
 * Made-up data for the read-only GUEST view of the admin area.
 *
 * Guests never see real products, orders, counts or settings. Every admin
 * page a guest can open builds its screen from this file instead, and does
 * so BEFORE any database query runs, so there is nothing real to leak. The
 * names, emails and numbers below are invented, and nothing in this file
 * ever queries the database.
 */

function product(
  n: number,
  name: string,
  category: string,
  price: string,
  stock: number,
  image: string,
  description: string
): ProductInput & { id: string } {
  return {
    id: `demo-product-${n}`,
    name,
    description,
    price,
    imageUrl: image,
    images: [],
    category,
    rooms: ["Living Room"],
    stock,
    plasticWeightKg: "2.50",
    featured: n <= 4,
    discountPercent: 0,
    discountReason: "",
    dealEndsAt: null,
    restockAt: null,
    variants: [],
  };
}

export const DEMO_PRODUCTS: (ProductInput & { id: string })[] = [
  product(1, "Sample Lounge Chair", "Chairs", "9500.00", 12, "/images/products/eco-lounge-chair.jpg", "A sample product used for the guest preview."),
  product(2, "Sample Coffee Table", "Tables", "7200.00", 8, "/images/products/recycled-coffee-table.jpg", "A sample product used for the guest preview."),
  product(3, "Sample Work Desk", "Desks", "11000.00", 3, "/images/products/work-desk.jpg", "A sample product used for the guest preview."),
  product(4, "Sample Garden Bench", "Benches", "6000.00", 5, "/images/products/garden-bench.jpg", "A sample product used for the guest preview."),
  product(5, "Sample Shelf", "Storage", "5400.00", 20, "/images/products/modular-shelf.jpg", "A sample product used for the guest preview."),
  product(6, "Sample Bar Stool", "Chairs", "3500.00", 2, "/images/products/eco-bar-stool.jpg", "A sample product used for the guest preview."),
  product(7, "Sample Plant Stand", "Storage", "1800.00", 30, "/images/products/plant-stand.jpg", "A sample product used for the guest preview."),
  product(8, "Sample Sofa", "Sofas", "24000.00", 4, "/images/products/sofa.jpg", "A sample product used for the guest preview."),
];

export function getDemoProduct(id: string) {
  return DEMO_PRODUCTS.find((p) => p.id === id) ?? null;
}

export function demoCategories(): string[] {
  return [...new Set(DEMO_PRODUCTS.map((p) => p.category))].sort();
}

const STATUSES = ["pending", "processing", "ready_for_delivery", "on_the_road", "delivered", "delivered", "cancelled", "pending", "delivered", "processing"];

export const DEMO_ORDERS = STATUSES.map((status, i) => {
  const n = i + 1;
  const paid = status !== "cancelled" && status !== "pending";
  return {
    id: `demo-order-${String(n).padStart(3, "0")}`,
    customerName: `Sample Customer ${n}`,
    customerEmail: `customer${n}@example.com`,
    createdAtIso: new Date(Date.UTC(2026, 10, 1 + n, 9, 30)).toISOString(),
    totalAmount: (3500 + n * 1250).toFixed(2),
    paymentStatus: paid ? "paid" : "unpaid",
    status,
  };
});

/** The numbers on the guest dashboard, worked out from the made-up data. */
export function demoDashboard() {
  const revenue = DEMO_ORDERS.filter((o) => o.paymentStatus === "paid").reduce(
    (sum, o) => sum + parseFloat(o.totalAmount),
    0
  );
  return {
    orderCount: DEMO_ORDERS.length,
    productCount: DEMO_PRODUCTS.length,
    revenue,
    lowStock: DEMO_PRODUCTS.filter((p) => p.stock <= 3).map((p) => ({ id: p.id, name: p.name, stock: p.stock })),
  };
}

/** The Settings screen for a guest: built-in defaults, never the real values. */
export function demoSettings(): SiteSettings {
  const out = {} as SiteSettings;
  for (const d of SETTING_DEFS) out[d.key] = d.default;
  for (const t of TEXT_DEFS) out[t.key] = "";
  out.announcementText = "Free delivery in Addis Ababa this week (sample text)";
  out.maintenanceMessage = "We are updating the shop and will be back soon. (sample text)";
  return out;
}

// ---- Sample data for the other guest screens (Inbox, Dispatchers, ...) ----

export const DEMO_EMAILS = [
  { id: "demo-mail-1", from: "sample.customer1@example.com", subject: "Question about delivery", body: "Hello, this is a sample message. How long does delivery take to my area?", receivedAt: "2026-11-24T08:15:00Z", read: false },
  { id: "demo-mail-2", from: "sample.shop@example.com", subject: "Wholesale enquiry", body: "Hi, this is a sample message from a made-up shop asking about bulk prices.", receivedAt: "2026-11-23T14:40:00Z", read: false },
  { id: "demo-mail-3", from: "sample.customer2@example.com", subject: "Thank you", body: "A sample thank-you note. The table arrived and looks great.", receivedAt: "2026-11-21T10:05:00Z", read: true },
  { id: "demo-mail-4", from: "sample.customer3@example.com", subject: "Wrong colour?", body: "A sample complaint about a colour. Nothing here is real.", receivedAt: "2026-11-19T17:30:00Z", read: true },
];

export const DEMO_AUDIENCE = { all: 128, recent: 41, repeat: 17 };

export const DEMO_DISPATCHERS = [
  { id: "demo-dispatcher-1", name: "Sample Dispatcher One", email: "dispatcher1@example.com" },
  { id: "demo-dispatcher-2", name: "Sample Dispatcher Two", email: "dispatcher2@example.com" },
];
export const DEMO_DISPATCHER_CANDIDATES = [
  { id: "demo-user-1", name: "Sample Person A", email: "person.a@example.com" },
  { id: "demo-user-2", name: "Sample Person B", email: "person.b@example.com" },
  { id: "demo-user-3", name: "Sample Person C", email: "person.c@example.com" },
];

export const DEMO_TELEGRAM_REQUESTS = [
  { id: "demo-tg-1", name: "Sample Requester One", reason: "I help with deliveries (sample reason).", status: "pending" as const },
  { id: "demo-tg-2", name: "Sample Requester Two", reason: "I manage the shop floor (sample reason).", status: "pending" as const },
  { id: "demo-tg-3", name: "Sample Approved Person", reason: "Sample reason.", status: "approved" as const },
];

export const DEMO_GUESTS = [
  { email: "guest.one@example.com", expiresAt: "2026-12-05T12:00:00Z", active: true },
  { email: "guest.two@example.com", expiresAt: "2026-11-10T12:00:00Z", active: false },
];
