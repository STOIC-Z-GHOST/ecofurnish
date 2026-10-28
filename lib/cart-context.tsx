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

export interface CartItem {
  productId: string;
  name: string;
  price: string; // snapshot at time of adding, as a decimal string
  imageUrl: string | null;
  quantity: number;
  stock: number;
}

interface CartContextValue {
  items: CartItem[];
  /** Returns how many units were actually added — less than asked (even
   * 0) when the cart already holds everything that's in stock. */
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => number;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
}

const CartContext = createContext<CartContextValue | null>(null);

function storageKeyFor(userId: string | null) {
  return `ecofurnish:cart:${userId ?? "guest"}`;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending } = useSession();
  const userId = session?.user?.id ?? null;

  const [items, setItems] = useState<CartItem[]>([]);
  // Tracks which account's cart is currently loaded, so we can tell when
  // the signed-in user has changed (sign in, sign out, or switched
  // accounts) and reload from that account's own storage key instead of
  // carrying another account's cart over.
  const [loadedFor, setLoadedFor] = useState<string | null | "unloaded">("unloaded");

  useEffect(() => {
    if (isPending) return; // don't load until we know who's signed in
    if (loadedFor === userId) return;

    try {
      const raw = window.localStorage.getItem(storageKeyFor(userId));
      let loaded: CartItem[] = raw ? JSON.parse(raw) : [];

      // Just signed in from a guest session — fold whatever was in the
      // guest cart into the account cart instead of silently stranding it
      // (guest and account carts are stored under different keys).
      if (userId && loadedFor === null) {
        const guestRaw = window.localStorage.getItem(storageKeyFor(null));
        const guestItems: CartItem[] = guestRaw ? JSON.parse(guestRaw) : [];
        if (guestItems.length > 0) {
          for (const guestItem of guestItems) {
            const existing = loaded.find((i) => i.productId === guestItem.productId);
            if (existing) {
              existing.quantity = Math.min(existing.quantity + guestItem.quantity, existing.stock);
            } else {
              loaded = [...loaded, guestItem];
            }
          }
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

  // Persist on every change, once the correct account's cart is loaded
  useEffect(() => {
    if (loadedFor === "unloaded" || loadedFor !== userId) return;
    try {
      window.localStorage.setItem(storageKeyFor(userId), JSON.stringify(items));
    } catch {
      // storage full or blocked — cart just won't persist this session
    }
  }, [items, userId, loadedFor]);

  const addItem: CartContextValue["addItem"] = (item, quantity = 1) => {
    const cap = Math.max(0, item.stock);
    const have = items.find((i) => i.productId === item.productId)?.quantity ?? 0;
    const added = Math.max(0, Math.min(quantity, cap - have));

    setItems((prev) => {
      const existing = prev.find((i) => i.productId === item.productId);
      if (existing) {
        // Always refresh the stock snapshot, and never leave more in the
        // cart than is actually in stock right now.
        const nextQty = Math.min(existing.quantity + added, cap);
        return prev.map((i) =>
          i.productId === item.productId ? { ...i, stock: cap, quantity: nextQty } : i
        );
      }
      if (added <= 0) return prev;
      return [...prev, { ...item, quantity: added }];
    });
    return added;
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        i.productId === productId
          ? { ...i, quantity: Math.min(quantity, i.stock) }
          : i
      )
    );
  };

  const clearCart = () => setItems([]);

  const totalItems = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + parseFloat(i.price) * i.quantity, 0),
    [items]
  );

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, subtotal }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}

/**
 * How much of a product can still be added: what's in stock minus what's
 * already in this cart. Drives the Add to Cart buttons so they stop
 * saying "add" once the whole stock is in the cart.
 */
export function useCartRoom(productId: string, stock: number) {
  const { items } = useCart();
  const inCart = items.find((i) => i.productId === productId)?.quantity ?? 0;
  const remaining = Math.max(0, stock - inCart);
  return { inCart, remaining, allInCart: stock > 0 && remaining === 0 };
}
