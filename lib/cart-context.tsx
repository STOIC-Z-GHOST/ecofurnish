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
import { cartLineKey } from "@/lib/variant-utils";

export { cartLineKey };

export interface CartItem {
  productId: string;
  /** Set for products that come in colors/sizes — the chosen option. */
  variantId?: string | null;
  /** "Red / Large" — shown in the cart and on the order. */
  variantLabel?: string | null;
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
  /** `key` is cartLineKey(item): the product id, plus the chosen option if any. */
  removeItem: (key: string) => void;
  updateQuantity: (key: string, quantity: number) => void;
  clearCart: () => void;
  /** False until this account's saved cart has been read from the browser.
   * Add to Cart buttons wait for it — before then the cart looks empty. */
  ready: boolean;
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
            const existing = loaded.find((i) => cartLineKey(i) === cartLineKey(guestItem));
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
      // On the very first load, anything added before the saved cart
      // finished loading (the session check can be slow) is merged in
      // rather than overwritten — it used to vanish, leaving a toast that
      // said "added" and a cart that hadn't changed. Not done when the
      // account changes: that must never carry another account's cart over.
      const firstLoad = loadedFor === "unloaded";
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setItems((early) => {
        if (!firstLoad || early.length === 0) return loaded;
        let merged = loaded;
        for (const e of early) {
          const have = merged.find((i) => cartLineKey(i) === cartLineKey(e));
          merged = have
            ? merged.map((i) =>
                cartLineKey(i) === cartLineKey(e)
                  ? { ...i, stock: e.stock, quantity: Math.min(i.quantity + e.quantity, e.stock) }
                  : i
              )
            : [...merged, e];
        }
        return merged;
      });
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
    const have = items.find((i) => cartLineKey(i) === cartLineKey(item))?.quantity ?? 0;
    const added = Math.max(0, Math.min(quantity, cap - have));

    setItems((prev) => {
      const existing = prev.find((i) => cartLineKey(i) === cartLineKey(item));
      if (existing) {
        // Always refresh the stock snapshot, and never leave more in the
        // cart than is actually in stock right now.
        const nextQty = Math.min(existing.quantity + added, cap);
        return prev.map((i) =>
          cartLineKey(i) === cartLineKey(item) ? { ...i, stock: cap, quantity: nextQty } : i
        );
      }
      if (added <= 0) return prev;
      return [...prev, { ...item, quantity: added }];
    });
    return added;
  };

  const removeItem = (key: string) => {
    setItems((prev) => prev.filter((i) => cartLineKey(i) !== key));
  };

  const updateQuantity = (key: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(key);
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        cartLineKey(i) === key
          ? { ...i, quantity: Math.min(quantity, i.stock) }
          : i
      )
    );
  };

  const clearCart = () => setItems([]);

  const ready = loadedFor !== "unloaded" && loadedFor === userId;

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
      value={{ items, addItem, removeItem, updateQuantity, clearCart, ready, totalItems, subtotal }}
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
export function useCartRoom(key: string, stock: number) {
  const { items, ready } = useCart();
  const inCart = items.find((i) => cartLineKey(i) === key)?.quantity ?? 0;
  const remaining = Math.max(0, stock - inCart);
  // `ready` matters: until the saved cart has loaded it looks empty, so
  // "how much is left" can't be trusted yet and the buttons wait.
  return { inCart, remaining, allInCart: ready && stock > 0 && remaining === 0, ready };
}
