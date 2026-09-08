"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export interface RecentlyViewedItem {
  productId: string;
  name: string;
  price: string;
  imageUrl: string | null;
  category: string;
  viewedAt: number;
}

interface RecentlyViewedContextValue {
  items: RecentlyViewedItem[];
  recordView: (item: Omit<RecentlyViewedItem, "viewedAt">) => void;
  clear: () => void;
}

const RecentlyViewedContext = createContext<RecentlyViewedContextValue | null>(null);

const STORAGE_KEY = "ecofurnish:recently-viewed";
// Keep this tight — it's "what did I just look at," not a full browsing
// history, and a long list would crowd the homepage sections it feeds
// ("Your Recent Finds" / "Pick Up From Where You Left Off").
const MAX_ITEMS = 12;

// Deliberately not scoped per-account like wishlist/cart — recently-viewed
// is "what has this browser been looking at," which is just as useful
// signed out as signed in, and doesn't need guest->account merge logic.
export function RecentlyViewedProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<RecentlyViewedItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      // Syncing from localStorage (external, unreadable during SSR/render).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setItems(raw ? JSON.parse(raw) : []);
    } catch {
      setItems([]);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // storage full or blocked — history just won't persist this session
    }
  }, [items, loaded]);

  function recordView(item: Omit<RecentlyViewedItem, "viewedAt">) {
    setItems((prev) => {
      const withoutThis = prev.filter((i) => i.productId !== item.productId);
      return [{ ...item, viewedAt: Date.now() }, ...withoutThis].slice(0, MAX_ITEMS);
    });
  }

  function clear() {
    setItems([]);
  }

  return (
    <RecentlyViewedContext.Provider value={{ items, recordView, clear }}>
      {children}
    </RecentlyViewedContext.Provider>
  );
}

export function useRecentlyViewed() {
  const ctx = useContext(RecentlyViewedContext);
  if (!ctx) {
    throw new Error("useRecentlyViewed must be used within a RecentlyViewedProvider");
  }
  return ctx;
}
