import { availableUnits, isProductAvailable, type Product } from "./types";

/** Umbral de "pocas unidades" en el panel */
export const LOW_STOCK = 3;

export type AdminProduct = Product & { visible: boolean };

export const ADMIN_FILTERS = {
  ocultos: { label: "Ocultos", test: (p: AdminProduct) => !p.visible },
  agotados: { label: "Agotados", test: (p: AdminProduct) => !isProductAvailable(p) },
  pocas: {
    label: "Pocas unidades",
    test: (p: AdminProduct) => p.options.some((o) => !o.soldOut && o.stock !== null && availableUnits(o) <= LOW_STOCK),
  },
  "sin-foto": { label: "Sin foto", test: (p: AdminProduct) => p.images.length === 0 },
} as const;

export type AdminFilter = keyof typeof ADMIN_FILTERS;
