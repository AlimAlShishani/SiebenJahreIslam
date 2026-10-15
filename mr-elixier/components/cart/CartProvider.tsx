"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { MAX_QTY, type SizeMl } from "@/lib/config";
import { lineKey, priceLines, type CartLine, type Totals } from "@/lib/order";

const STORAGE_KEY = "mr-elixier-cart-v1";

interface CartContextValue extends Totals {
  items: CartLine[];
  /** true, sobald der gespeicherte Warenkorb geladen ist */
  ready: boolean;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  add: (slug: string, ml: SizeMl, qty?: number, options?: { open?: boolean }) => void;
  setQty: (slug: string, ml: SizeMl, qty: number) => void;
  remove: (slug: string, ml: SizeMl) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function readStorage(): CartLine[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    // priceLines verwirft unbekannte Düfte/Größen automatisch
    return priceLines(parsed as CartLine[]).lines.map(({ slug, ml, qty }) => ({ slug, ml, qty }));
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  const [isOpen, setOpen] = useState(false);

  useEffect(() => {
    setItems(readStorage());
    setReady(true);
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) setItems(readStorage());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* Speicher nicht verfügbar (z. B. privater Modus) – Warenkorb bleibt im Speicher */
    }
  }, [items, ready]);

  const add = useCallback<CartContextValue["add"]>((slug, ml, qty = 1, options) => {
    setItems((prev) => {
      const key = lineKey({ slug, ml });
      const existing = prev.find((l) => lineKey(l) === key);
      if (existing) {
        return prev.map((l) => (lineKey(l) === key ? { ...l, qty: Math.min(l.qty + qty, MAX_QTY) } : l));
      }
      return [...prev, { slug, ml, qty: Math.min(qty, MAX_QTY) }];
    });
    if (options?.open !== false) setOpen(true);
  }, []);

  const setQty = useCallback<CartContextValue["setQty"]>((slug, ml, qty) => {
    const key = lineKey({ slug, ml });
    setItems((prev) =>
      qty <= 0
        ? prev.filter((l) => lineKey(l) !== key)
        : prev.map((l) => (lineKey(l) === key ? { ...l, qty: Math.min(qty, MAX_QTY) } : l)),
    );
  }, []);

  const remove = useCallback<CartContextValue["remove"]>((slug, ml) => {
    const key = lineKey({ slug, ml });
    setItems((prev) => prev.filter((l) => lineKey(l) !== key));
  }, []);

  const clear = useCallback(() => setItems([]), []);
  const open = useCallback(() => setOpen(true), []);
  const close = useCallback(() => setOpen(false), []);

  const value = useMemo<CartContextValue>(
    () => ({ ...priceLines(items), items, ready, isOpen, open, close, add, setQty, remove, clear }),
    [items, ready, isOpen, open, close, add, setQty, remove, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart muss innerhalb von <CartProvider> verwendet werden");
  return ctx;
}
