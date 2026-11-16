// Carrito: vive en el navegador (localStorage). Guarda una copia de nombre, precio y foto para mostrarse
// al instante, pero el servidor recalcula precios y disponibilidad antes de cobrar (quoteCart / placeOrder).

import { unitPrice, type Bulk } from "@/lib/catalog/pricing";

export const MAX_QTY = 99;
export const NOTE_MAX = 300;

export type CartLine = {
  optionId: number;
  quantity: number;
  /** Respuesta a la personalización ("Color y mensaje") */
  note: string;
  slug: string;
  productName: string;
  /** null si el producto tiene una sola presentación */
  optionName: string | null;
  price: number;
  /** Precio por cantidad de la presentación (p. ej. por docena) */
  bulk?: Bulk | null;
  image: string | null;
};

/** Dos líneas son la misma si son la misma presentación con la misma personalización. */
export const lineKey = (l: Pick<CartLine, "optionId" | "note">) => `${l.optionId}|${l.note.trim()}`;

/** Lo que el navegador manda al servidor: solo ids, cantidades y notas. */
export type CartRequest = { optionId: number; quantity: number; note: string }[];

/** Respuesta de quoteCart: cada línea con el precio y el máximo vigentes. */
export type QuotedLine = {
  key: string;
  /** false si el producto ya no está a la venta */
  ok: boolean;
  price: number;
  bulk: Bulk | null;
  /** Unidades que se pueden comprar (null = sin límite) */
  max: number | null;
  productName: string;
  optionName: string | null;
  slug: string;
  image: string | null;
};

/** Unidades de una presentación en todo el carrito (varias líneas si tienen distinta personalización). */
export const optionQty = (lines: Pick<CartLine, "optionId" | "quantity">[], optionId: number) =>
  lines.reduce((n, l) => (l.optionId === optionId ? n + l.quantity : n), 0);

/** Precio por unidad de la línea: con el precio por cantidad si el carrito ya llega al mínimo de esa presentación. */
export const linePrice = (line: CartLine, lines: CartLine[]) => unitPrice(line, optionQty(lines, line.optionId));

export const lineTotal = (line: CartLine, lines: CartLine[]) => linePrice(line, lines) * line.quantity;
