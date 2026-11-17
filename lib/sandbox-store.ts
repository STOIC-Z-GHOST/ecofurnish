"use client";

import { useSyncExternalStore } from "react";
import type { ProductInput } from "@/app/admin/actions";

/**
 * The guest "sandbox": a read-only admin guest can still click Edit, change
 * a price, change an order's status — and see it happen — but every change
 * is kept ONLY in their own browser (localStorage). Nothing here ever calls
 * a server action, so the real store can't be touched; the guest-facing
 * screens simply lay these local edits over the real data they were sent.
 * "Reset" wipes them.
 */

const KEY = "ecofurnish-admin-sandbox-v1";

export interface SandboxOrderEdit {
  status?: string;
  trackingNote?: string;
}

export interface SandboxState {
  /** Edits to real products, by product id. */
  products: Record<string, ProductInput>;
  /** Products the guest "created" (ids start with "local-"). */
  created: Record<string, ProductInput>;
  /** Hidden products (real ids or local ids). */
  deleted: string[];
  orders: Record<string, SandboxOrderEdit>;
}

const EMPTY: SandboxState = { products: {}, created: {}, deleted: [], orders: {} };

let memoryFallback: SandboxState | null = null; // if localStorage is blocked
let cache: { raw: string | null; state: SandboxState } | null = null;
const listeners = new Set<() => void>();

function read(): SandboxState {
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    return memoryFallback ?? EMPTY;
  }
  if (cache && cache.raw === raw) return cache.state;
  let state = EMPTY;
  try {
    if (raw) state = { ...EMPTY, ...(JSON.parse(raw) as Partial<SandboxState>) };
  } catch {
    state = EMPTY; // corrupted value: start clean
  }
  cache = { raw, state };
  return state;
}

function write(next: SandboxState) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    memoryFallback = next;
  }
  cache = null;
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener); // other tabs
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

export function getSandboxState(): SandboxState {
  return read();
}

export function saveSandboxProduct(id: string, input: ProductInput) {
  const s = read();
  if (id.startsWith("local-")) {
    write({ ...s, created: { ...s.created, [id]: input }, deleted: s.deleted.filter((d) => d !== id) });
  } else {
    write({ ...s, products: { ...s.products, [id]: input } });
  }
}

export function deleteSandboxProduct(id: string) {
  const s = read();
  if (s.deleted.includes(id)) return;
  write({ ...s, deleted: [...s.deleted, id] });
}

export function setSandboxOrder(id: string, patch: SandboxOrderEdit) {
  const s = read();
  write({ ...s, orders: { ...s.orders, [id]: { ...s.orders[id], ...patch } } });
}

export function resetSandbox() {
  write(EMPTY);
}

export function countSandboxChanges(s: SandboxState): number {
  return (
    Object.keys(s.products).length +
    Object.keys(s.created).length +
    s.deleted.length +
    Object.keys(s.orders).length
  );
}

/** The guest's local edits; re-renders when they change. Empty on the server. */
export function useSandbox(): SandboxState {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

/** False during server render / hydration, true once running in the browser. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}
