"use client";

import { useEffect } from "react";
import { setRealStockMode } from "@/lib/simulated-stock";
import { notifyStockChanged } from "@/lib/use-effective-stock";

// Tells the browser-side stock display whether the store is in real-stock
// mode (Admin > Settings). Rendered once in the root layout.
export default function SiteModeSync({ realStock }: { realStock: boolean }) {
  // Set during render so it is already correct before any effect that reads
  // stock runs; the effect below then asks the stock displays to refresh.
  setRealStockMode(realStock);
  useEffect(() => {
    notifyStockChanged();
  }, [realStock]);
  return null;
}
