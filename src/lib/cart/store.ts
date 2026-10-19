"use client";

import { useSyncExternalStore } from "react";
import { lineKey, MAX_QTY, type CartLine } from "./types";

// Estado del carrito en localStorage, compartido entre pestañas (evento "storage").

const KEY = "lusarte-carrito-v1";
const EMPTY: CartLine[] = [];
const listeners = new Set<() => void>();
let cache: { raw: string | null; lines: CartLine[] } = { raw: null, lines: EMPTY };

function read(): CartLine[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return cache.lines;
  }
  if (raw === cache.raw) return cache.lines;
  let lines: CartLine[] = EMPTY;
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) lines = parsed.filter((l) => Number.isInteger(l?.optionId) && Number.isInteger(l?.quantity) && l.quantity > 0);
  } catch {
    // carrito dañado: se empieza de cero
  }
  cache = { raw, lines };
  return lines;
}

function write(lines: CartLine[]) {
  const raw = JSON.stringify(lines);
  cache = { raw, lines };
  try {
    localStorage.setItem(KEY, raw);
  } catch {
    // modo privado o almacenamiento bloqueado: el carrito vive solo en memoria
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => e.key === KEY && listener();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useCart() {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export const cartCount = (lines: CartLine[]) => lines.reduce((n, l) => n + l.quantity, 0);
export const cartSubtotal = (lines: CartLine[]) => lines.reduce((n, l) => n + l.price * l.quantity, 0);

export const cart = {
  add(line: CartLine, max: number | null) {
    const lines = read();
    const key = lineKey(line);
    const limit = Math.min(MAX_QTY, max ?? MAX_QTY);
    const existing = lines.find((l) => lineKey(l) === key);
    const note = line.note.trim();
    if (existing) write(lines.map((l) => (l === existing ? { ...line, note, quantity: Math.min(limit, l.quantity + line.quantity) } : l)));
    else write([...lines, { ...line, note, quantity: Math.min(limit, line.quantity) }]);
  },
  setQuantity(key: string, quantity: number) {
    write(read().map((l) => (lineKey(l) === key ? { ...l, quantity: Math.max(1, Math.min(MAX_QTY, quantity)) } : l)));
  },
  remove(key: string) {
    write(read().filter((l) => lineKey(l) !== key));
  },
  /** Actualiza nombre, precio y foto con lo que respondió el servidor */
  patch(updates: Map<string, Partial<CartLine>>) {
    const lines = read();
    const next = lines.map((l) => {
      const u = updates.get(lineKey(l));
      return u ? { ...l, ...u } : l;
    });
    if (JSON.stringify(next) !== JSON.stringify(lines)) write(next);
  },
  clear() {
    write([]);
  },
};

// Mini carrito lateral: se abre al agregar un producto
const drawerListeners = new Set<() => void>();
let drawerOpen = false;

export const drawer = {
  open() {
    drawerOpen = true;
    drawerListeners.forEach((l) => l());
  },
  close() {
    drawerOpen = false;
    drawerListeners.forEach((l) => l());
  },
};

export function useDrawer() {
  return useSyncExternalStore(
    (l) => {
      drawerListeners.add(l);
      return () => drawerListeners.delete(l);
    },
    () => drawerOpen,
    () => false,
  );
}
