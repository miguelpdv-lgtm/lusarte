import { availableUnits, type AdminOption, type AdminProduct } from "./types";

/** Umbral de "pocas unidades" (o el stock mínimo de Effi si es mayor) */
export const LOW_STOCK = 3;

const shown = (p: AdminProduct) => p.options.filter((o) => !o.hidden);
export const isLow = (o: AdminOption) => o.stock !== null && o.stock > 0 && o.stock <= Math.max(LOW_STOCK, o.stockMinimo);

export const ADMIN_FILTERS = {
  ocultos: { label: "Ocultos", test: (p: AdminProduct) => !p.visible },
  agotados: { label: "Agotados", test: (p: AdminProduct) => !shown(p).some((o) => availableUnits(o) > 0) },
  pocas: { label: "Pocas unidades", test: (p: AdminProduct) => shown(p).some(isLow) },
  "sin-foto": { label: "Sin foto", test: (p: AdminProduct) => p.images.length === 0 },
  "sin-descripcion": { label: "Sin descripción", test: (p: AdminProduct) => p.description.trim() === "" },
  "sin-categoria": { label: "Sin categoría", test: (p: AdminProduct) => p.category === null },
} as const;

export type AdminFilter = keyof typeof ADMIN_FILTERS;
