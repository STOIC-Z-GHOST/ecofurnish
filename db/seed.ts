import "dotenv/config";
import { db } from "./index";
import { products } from "./schema";

// Placeholder prices/descriptions — edit these to your real numbers before
// you seed a production database. Prices are in ETB to match the site's
// default currency.
const productData = [
  {
    name: "Eco Bar Stool",
    description:
      "A compact bar stool with a seat molded from recycled ocean plastic and a solid oak frame.",
    price: "3500.00",
    imageUrl: "/products/eco-bar-stool.jpg",
    category: "Seating",
    rooms: ["Living Room"],
    stock: 24,
    plasticWeightKg: "1.20",
  },
  {
    name: "Eco Lounge Chair",
    description:
      "A relaxed lounge chair with a recycled-plastic shell, oak frame, and a removable linen cushion set.",
    price: "9500.00",
    imageUrl: "/products/eco-lounge-chair.jpg",
    category: "Seating",
    rooms: ["Living Room", "Bedroom"],
    stock: 12,
    plasticWeightKg: "2.80",
  },
  {
    name: "Garden Bench",
    description:
      "A weather-resistant outdoor bench built from reclaimed hardwood and recycled composite slats.",
    price: "7500.00",
    imageUrl: "/products/garden-bench.jpg",
    category: "Seating",
    rooms: [],
    stock: 8,
    plasticWeightKg: "3.50",
  },
  {
    name: "Recycled Coffee Table",
    description:
      "A round coffee table on a sculptural spider-leg base, oak from the tabletop down through the upper leg, transitioning to a flecked recycled-plastic composite for the lower half of each leg.",
    price: "8500.00",
    imageUrl: "/products/recycled-coffee-table.jpg",
    category: "Tables",
    rooms: ["Living Room"],
    stock: 10,
    plasticWeightKg: "4.10",
  },
  {
    name: "Work Desk",
    description:
      "A clean-lined work desk with a dark speckled recycled-plastic composite top and legs, built to last.",
    price: "11000.00",
    imageUrl: "/products/work-desk.jpg",
    category: "Tables",
    rooms: ["Office"],
    stock: 6,
    plasticWeightKg: "3.90",
  },
  {
    name: "Modular Shelf",
    description:
      "A stackable, modular shelving unit made from recycled plastic panels and oak trim.",
    price: "6000.00",
    imageUrl: "/products/modular-shelf.jpg",
    category: "Storage & Decor",
    rooms: ["Living Room", "Bedroom", "Office"],
    stock: 15,
    plasticWeightKg: "5.20",
  },
  {
    name: "Plant Stand",
    description:
      "A minimalist plant stand made from recycled ocean plastic, finished in a soft terracotta tone.",
    price: "1800.00",
    imageUrl: "/products/plant-stand.jpg",
    category: "Storage & Decor",
    rooms: ["Living Room", "Bedroom", "Office"],
    stock: 30,
    plasticWeightKg: "0.60",
  },
];

async function seed() {
  console.log(`Seeding ${productData.length} products...`);
  const inserted = await db.insert(products).values(productData).returning({ id: products.id, name: products.name });
  inserted.forEach((p) => console.log(`  ✓ ${p.name} (${p.id})`));
  console.log("Done.");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
