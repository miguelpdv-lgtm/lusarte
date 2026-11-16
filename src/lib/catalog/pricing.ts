import { formatCOP } from "@/lib/format";

/**
 * Precio por cantidad de una presentación (p. ej. recipientes por docena): desde `minQty` unidades de la misma
 * presentación, cada una sale a `price`. Lo configura la dueña en Panel → Productos (solo existe en la web).
 */
export type Bulk = { minQty: number; price: number };

/** Precio de lista de la presentación con su precio por cantidad, si lo tiene. */
export type Priced = { price: number; bulk?: Bulk | null };

/** El precio por cantidad solo vale si de verdad rebaja y pide más de una unidad. */
export const validBulk = (p: Priced): Bulk | null => (p.bulk && p.bulk.minQty > 1 && p.bulk.price > 0 && p.bulk.price < p.price ? p.bulk : null);

/** Precio por unidad para `qty` unidades de la misma presentación. */
export function unitPrice(p: Priced, qty: number) {
  const bulk = validBulk(p);
  return bulk && qty >= bulk.minQty ? bulk.price : p.price;
}

/** "Por docena" (12), "Desde 6 unidades" */
export const bulkLabel = (minQty: number) => (minQty === 12 ? "Por docena" : `Desde ${minQty} unidades`);

/** "Por docena: $ 3.000 c/u" */
export const bulkText = (b: Bulk) => `${bulkLabel(b.minQty)}: ${formatCOP(b.price)} c/u`;
