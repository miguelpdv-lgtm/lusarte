import { categories } from "@/data/catalog";
import { cheapestOption, isProductAvailable, type Product } from "./types";

// Filtros y orden de la tienda. Sin dependencias de servidor: lo usan también componentes cliente.

export const SORTS = {
  destacados: "Destacados",
  "precio-asc": "Menor precio",
  "precio-desc": "Mayor precio",
  nuevos: "Más nuevos",
} as const;
export type Sort = keyof typeof SORTS;

export const PRICE_RANGES = [
  { slug: "hasta-10000", label: "Hasta $10.000", min: 0, max: 10000 },
  { slug: "10000-30000", label: "$10.000 a $30.000", min: 10000, max: 30000 },
  { slug: "30000-60000", label: "$30.000 a $60.000", min: 30000, max: 60000 },
  { slug: "desde-60000", label: "Más de $60.000", min: 60000, max: Infinity },
] as const;

export type Filters = {
  category?: string;
  subcategory?: string;
  navidad?: boolean;
  q?: string;
  price?: string;
  available?: boolean;
  sort?: Sort;
  page?: number;
};

export const PER_PAGE = 24;

const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

const categoryName = new Map(categories.map((c) => [c.slug, c.name]));

export function filterProducts(all: Product[], f: Filters) {
  let list = all;
  if (f.category) list = list.filter((p) => p.category === f.category);
  if (f.subcategory) list = list.filter((p) => p.subcategory === f.subcategory);
  if (f.navidad) list = list.filter((p) => p.navidad);
  if (f.available) list = list.filter(isProductAvailable);

  const range = PRICE_RANGES.find((r) => r.slug === f.price);
  if (range) {
    list = list.filter((p) => {
      const price = cheapestOption(p)?.price ?? 0;
      return price >= range.min && price <= range.max;
    });
  }

  if (f.q?.trim()) {
    const words = normalize(f.q).split(/\s+/).filter(Boolean);
    list = list.filter((p) => {
      const haystack = normalize(`${p.name} ${p.description} ${categoryName.get(p.category) ?? ""} ${p.options.map((o) => o.name).join(" ")}`);
      return words.every((w) => haystack.includes(w));
    });
  }

  const price = (p: Product) => cheapestOption(p)?.price ?? 0;
  const sorted = [...list];
  switch (f.sort ?? "destacados") {
    case "precio-asc":
      sorted.sort((a, b) => price(a) - price(b));
      break;
    case "precio-desc":
      sorted.sort((a, b) => price(b) - price(a));
      break;
    case "nuevos":
      sorted.sort((a, b) => b.createdAt - a.createdAt);
      break;
    default:
      // Destacados primero, luego disponibles, luego el orden del catálogo
      sorted.sort(
        (a, b) =>
          Number(b.featured) - Number(a.featured) ||
          Number(isProductAvailable(b)) - Number(isProductAvailable(a)) ||
          a.position - b.position,
      );
  }

  const pages = Math.max(1, Math.ceil(sorted.length / PER_PAGE));
  const page = Math.min(Math.max(1, f.page ?? 1), pages);
  return {
    total: sorted.length,
    page,
    pages,
    items: sorted.slice((page - 1) * PER_PAGE, page * PER_PAGE),
  };
}
