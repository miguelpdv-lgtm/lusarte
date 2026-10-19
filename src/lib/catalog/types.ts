// Tipos del catálogo compartidos por la tienda, el panel y los componentes cliente.

export type ProductOption = {
  id: number;
  name: string;
  /** De Effi (tarifa normal) */
  price: number;
  compareAtPrice: number | null;
  /** De Effi. null = el artículo no lleva control de stock */
  stock: number | null;
  soldOut: boolean;
};

/** Presentación vista desde el panel: con los datos del artículo de Effi. */
export type AdminOption = ProductOption & {
  hidden: boolean;
  effiArticleId: number;
  effiName: string;
  referencia: string | null;
  precioEspecial: number;
  stockMinimo: number;
  /** 0-1 sin control de stock, 2+ con control */
  gestionStock: number;
  costo: number;
  categoriaId: number | null;
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

/** Producto visto desde el panel. category es null si la categoría de Effi no está mapeada. */
export type AdminProduct = Omit<Product, "options" | "category"> & {
  category: string | null;
  visible: boolean;
  options: AdminOption[];
  /** Categoría de Effi del producto (la de su primera presentación) */
  effiCategoryId: number | null;
};
