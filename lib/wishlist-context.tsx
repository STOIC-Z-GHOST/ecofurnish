"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useSession } from "@/lib/auth-client";

export interface WishlistItem {
  productId: string;
  name: string;
  price: string;
  imageUrl: string | null;
  /** Comes in colors/sizes — so "add to cart" must go via the product page. */
  hasVariants?: boolean;
}

interface WishlistContextValue {
  items: WishlistItem[];
  isWishlisted: (productId: string) => boolean;
  toggleItem: (item: WishlistItem) => void;
  removeItem: (productId: string) => void;
  totalItems: number;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

function storageKeyFor(userId: string | null) {
  return `ecofurnish:wishlist:${userId ?? "guest"}`;
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending } = useSession();
  const userId = session?.user?.id ?? null;

  const [items, setItems] = useState<WishlistItem[]>([]);
  // Same per-account reload pattern as CartProvider — see the comment there.
  const [loadedFor, setLoadedFor] = useState<string | null | "unloaded">("unloaded");

  useEffect(() => {
    if (isPending) return;
    if (loadedFor === userId) return;

    try {
      const raw = window.localStorage.getItem(storageKeyFor(userId));
      let loaded: WishlistItem[] = raw ? JSON.parse(raw) : [];

      // Just signed in from a guest session — fold the guest wishlist into
      // the account's instead of silently stranding it.
      if (userId && loadedFor === null) {
        const guestRaw = window.localStorage.getItem(storageKeyFor(null));
        const guestItems: WishlistItem[] = guestRaw ? JSON.parse(guestRaw) : [];
        if (guestItems.length > 0) {
          const existingIds = new Set(loaded.map((i) => i.productId));
          loaded = [...loaded, ...guestItems.filter((i) => !existingIds.has(i.productId))];
          window.localStorage.removeItem(storageKeyFor(null));
        }
      }

      // Syncing from localStorage (external, unreadable during SSR/render).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setItems(loaded);
    } catch {
      setItems([]);
    }
    setLoadedFor(userId);
  }, [isPending, userId, loadedFor]);

  useEffect(() => {
    if (loadedFor === "unloaded" || loadedFor !== userId) return;
    try {
      window.localStorage.setItem(storageKeyFor(userId), JSON.stringify(items));
    } catch {
      // storage full or blocked — wishlist just won't persist this session
    }
  }, [items, userId, loadedFor]);

  function isWishlisted(productId: string) {
    return items.some((i) => i.productId === productId);
  }

  function toggleItem(item: WishlistItem) {
    setItems((prev) =>
      prev.some((i) => i.productId === item.productId)
        ? prev.filter((i) => i.productId !== item.productId)
        : [...prev, item]
    );
  }

  function removeItem(productId: string) {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }

  const totalItems = useMemo(() => items.length, [items]);

  return (
    <WishlistContext.Provider
      value={{ items, isWishlisted, toggleItem, removeItem, totalItems }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within a WishlistProvider");
  return ctx;
}
