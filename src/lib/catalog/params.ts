import { PRICE_RANGES, SORTS, type Filters, type Sort } from "./filters";

type SearchParams = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** Lee los filtros de la URL: ?q=&precio=&disponibles=1&orden=&pagina= */
export function parseFilters(sp: SearchParams): Filters {
  const sort = one(sp.orden);
  const price = one(sp.precio);
  const page = Number(one(sp.pagina));
  return {
    q: one(sp.q)?.slice(0, 80) || undefined,
    price: PRICE_RANGES.some((r) => r.slug === price) ? price : undefined,
    available: one(sp.disponibles) === "1",
    sort: sort && sort in SORTS ? (sort as Sort) : undefined,
    page: Number.isInteger(page) && page > 1 ? page : undefined,
  };
}

/** URL de la misma página cambiando algunos filtros (null = quitar). Cambiar un filtro vuelve a la página 1. */
export function filtersHref(path: string, current: Filters, patch: Partial<Record<"q" | "precio" | "disponibles" | "orden" | "pagina", string | null>>) {
  const values: Record<string, string | null | undefined> = {
    q: current.q,
    precio: current.price,
    disponibles: current.available ? "1" : null,
    orden: current.sort,
    pagina: null,
    ...patch,
  };
  if (!("pagina" in patch)) values.pagina = null;
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(values)) if (v) sp.set(k, v);
  const s = sp.toString();
  return s ? `${path}?${s}` : path;
}
