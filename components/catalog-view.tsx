"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** Normalizes a product's `rooms` value defensively. Expected shape is a
 * real string[], but this also handles a raw Postgres array literal
 * (e.g. `{Living Room,Bedroom}`, in case one ever arrives unparsed) or a
 * JSON string, and trims whitespace on each entry. Falls back to []
 * rather than throwing, so one malformed row can't break the whole page. */
function normalizeRooms(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((r) => String(r).trim()).filter(Boolean);
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      return trimmed
        .slice(1, -1)
        .split(",")
        .map((r) => r.replace(/^"|"$/g, "").trim())
        .filter(Boolean);
    }
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.map((r) => String(r).trim()).filter(Boolean);
    } catch {
      // Not JSON either — fall through to the empty-array default below.
    }
  }
  return [];
}
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ProductCard from "@/components/product/ProductCard";
import { CURRENCIES, type Currency } from "@/lib/currency";
import { useCurrency } from "@/lib/currency-context";
import { ExchangeRateNote } from "@/components/currency/ExchangeRateNote";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: string;
  imageUrl: string | null;
  images: string[];
  category: string;
  rooms: string[];
  stock: number;
  plasticWeightKg: string;
}

export function CatalogView({ products }: { products: Product[] }) {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>(searchParams.get("category") || "all");
  const [room, setRoom] = useState<string>(searchParams.get("room") || "all");
  const { currency, setCurrency } = useCurrency();
  const searchInputRef = useRef<HTMLInputElement>(null);
  // Phones: the three dropdowns hide behind a small filter button next to
  // the search box. From sm up they sit in the toolbar as before.
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Re-sync both filters whenever their URL param changes — e.g. clicking a
  // "Living Room" tile while already on this page doesn't remount
  // CatalogView (same route, just new search params), so relying on
  // useState's one-time initial value alone would leave the filter stuck
  // on whatever it was showing before.
  const categoryParam = searchParams.get("category");
  const roomParam = searchParams.get("room");
  useEffect(() => {
    if (categoryParam) setCategory(categoryParam); // eslint-disable-line react-hooks/set-state-in-effect
    if (roomParam) setRoom(roomParam);
  }, [categoryParam, roomParam]);

  // The navbar's search icon links here with ?focusSearch=1 (see
  // SearchButton) so that landing on this section actually drops you into
  // a ready-to-type box, not just scrolled nearby. The rAF delay lets the
  // browser's own #all-products hash-scroll finish first, so focusing
  // doesn't fight that scroll or fire before the element has settled.
  const focusSearchParam = searchParams.get("focusSearch");
  useEffect(() => {
    if (!focusSearchParam) return;
    const id = requestAnimationFrame(() => searchInputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [focusSearchParam]);

  const activeFilters =
    (room !== "all" ? 1 : 0) + (category !== "all" ? 1 : 0) + (currency !== "ETB" ? 1 : 0);

  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category))).sort(),
    [products]
  );

  const rooms = useMemo(() => {
    // Case-insensitive dedup — some rows were tagged with inconsistent
    // casing ("Living room" vs "Living Room") from manual DB edits;
    // this keeps them from showing as two separate confusing entries.
    const seen = new Map<string, string>();
    for (const p of products) {
      for (const r of normalizeRooms(p.rooms)) {
        const key = r.toLowerCase();
        if (!seen.has(key)) seen.set(key, r);
      }
    }
    return Array.from(seen.values()).sort();
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory = category === "all" || p.category === category;
      const matchesRoom =
        room === "all" ||
        normalizeRooms(p.rooms).some(
          (r) => r.toLowerCase() === "all" || r.toLowerCase() === room.toLowerCase()
        );
      const matchesSearch =
        search.trim() === "" ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.description ?? "").toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesRoom && matchesSearch;
    });
  }, [products, search, category, room]);

  return (
    <div>
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              placeholder="Search products…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 pl-9 sm:h-8"
            />
          </div>

          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            aria-expanded={filtersOpen}
            aria-controls="catalog-filters"
            aria-label="Filters"
            className={cn(
              "relative inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-input text-foreground transition-colors hover:bg-muted sm:hidden",
              filtersOpen && "bg-muted"
            )}
          >
            <SlidersHorizontal className="size-4" aria-hidden="true" />
            {activeFilters > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                {activeFilters}
              </span>
            )}
          </button>
        </div>

        {/* The three dropdowns. Phones: hidden until the filter button is
            tapped, then stacked. sm and up: always shown, in the toolbar row. */}
        <div
          id="catalog-filters"
          className={cn("gap-3 sm:contents", filtersOpen ? "grid" : "hidden")}
        >
        <Select value={room} onValueChange={(v) => setRoom(v ?? "all")}>
          <SelectTrigger className="w-full sm:w-40" aria-label="Filter by room">
            <SelectValue placeholder="Room" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All rooms</SelectItem>
            {rooms.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={category} onValueChange={(v) => setCategory(v ?? "all")}>
          <SelectTrigger className="w-full sm:w-48" aria-label="Filter by category">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={currency} onValueChange={(v) => setCurrency((v as Currency) ?? "ETB")}>
          <SelectTrigger className="w-full sm:w-28" aria-label="Select currency">
            <SelectValue placeholder="Currency" />
          </SelectTrigger>
          <SelectContent>
            {CURRENCIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        </div>
      </div>

      {currency !== "ETB" && (
        <ExchangeRateNote className="-mt-5 mb-6 text-right text-xs text-muted-foreground" />
      )}

      {filtered.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed bg-muted/20 py-24 text-center">
          <h2 className="mb-2 text-2xl font-semibold">No products match</h2>
          <p className="text-muted-foreground">Try a different search term or category.</p>
        </div>
      ) : (
        /* Phones: one column of horizontal cards (Amazon search style) so a
            full product name has room. md and up: the grid, 3 then 4 wide. */
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-6 lg:grid-cols-4 lg:gap-8">
          {filtered.map((product, index) => {
            // Past the first couple of rows, nobody is watching the
            // stagger anyway — skip the animation class and inline
            // animationDelay style entirely instead of just capping the
            // delay, so a full catalog isn't paying style/layout cost on
            // every card for an effect only the first ~8 are ever seen in.
            const animated = index < 8;
            return (
              <div
                key={product.id}
                className={
                  animated
                    ? "animate-in fade-in-0 slide-in-from-bottom-3 fill-mode-backwards duration-500"
                    : undefined
                }
                style={animated ? { animationDelay: `${index * 40}ms` } : undefined}
              >
                <ProductCard product={product} currency={currency} layout="row" />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
