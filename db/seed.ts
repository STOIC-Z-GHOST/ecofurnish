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
      "A compact bar stool with a seat molded from 1.2 kg of recycled ocean plastic, set on a solid oak frame. Easy to wipe clean and sturdy enough for daily use.",
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
      "A deep, relaxed lounge chair with a shell made from 2.8 kg of recycled plastic and an oak frame. The linen cushion set lifts off for washing.",
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
      "An outdoor bench built to stay out in the rain. Reclaimed hardwood and recycled composite slats keep 3.5 kg of plastic out of the landfill.",
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
      "A round coffee table with a sculptural spider-leg base. The oak top flows into upper legs of oak, while the lower legs are a flecked composite made from 4.1 kg of recycled plastic.",
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
      "A clean-lined desk with a dark, speckled top and legs made from 3.9 kg of recycled plastic. Built for long working days and easy to keep tidy.",
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
      "A shelf that grows with you. Stack the recycled plastic panels, trimmed in oak, to fit your wall. Each unit diverts 5.2 kg of plastic.",
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
      "A minimalist stand in soft terracotta, molded from 0.6 kg of recycled ocean plastic. Gives a favorite plant a little height.",
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
