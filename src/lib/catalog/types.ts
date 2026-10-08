// Tipos del catálogo compartidos por la tienda, el panel y los componentes cliente.

export type ProductOption = {
  id: number;
  name: string;
  price: number;
  compareAtPrice: number | null;
  /** null = sin conteo de inventario */
  stock: number | null;
  soldOut: boolean;
};

export type ProductImage = {
  id: number;
  url: string;
  alt: string;
  width: number;
  height: number;
};

export type Product = {
  id: number;
  slug: string;
  name: string;
  category: string;
  subcategory: string | null;
  description: string;
  warning: string | null;
  badge: string | null;
  personalization: string | null;
  featured: boolean;
  navidad: boolean;
  position: number;
  /** Milisegundos, para ordenar por "más nuevos" */
  createdAt: number;
  options: ProductOption[];
  images: ProductImage[];
};

/** Unidades que se pueden vender de una presentación (Infinity si no lleva conteo). */
export function availableUnits(o: ProductOption) {
  if (o.soldOut) return 0;
  return o.stock === null ? Infinity : Math.max(0, o.stock);
}

export const isOptionAvailable = (o: ProductOption) => availableUnits(o) > 0;
export const isProductAvailable = (p: Product) => p.options.some(isOptionAvailable);

/** Presentación más barata entre las disponibles (o entre todas si está agotado). */
export function cheapestOption(p: Product) {
  const pool = p.options.filter(isOptionAvailable);
  const list = pool.length ? pool : p.options;
  return list.reduce<ProductOption | undefined>((min, o) => (!min || o.price < min.price ? o : min), undefined);
}
