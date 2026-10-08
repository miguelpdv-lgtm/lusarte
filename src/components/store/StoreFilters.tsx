"use client";

import { SORTS } from "@/lib/catalog/filters";
import { SearchIcon } from "@/components/ui/icons";

type Props = { q?: string; sort?: string; available?: boolean; price?: string };

/** Búsqueda, orden y "solo disponibles". Es un formulario GET: funciona sin JavaScript, y con JS se aplica al cambiar. */
export function StoreFilters({ q, sort, available, price }: Props) {
  return (
    <form
      role="search"
      className="flex flex-wrap items-center gap-2"
      onChange={(e) => {
        // El texto se aplica al presionar Enter; los selectores, apenas cambian
        const target = e.target as unknown as HTMLInputElement | HTMLSelectElement;
        if (target.type !== "search") e.currentTarget.requestSubmit();
      }}
    >
      {price && <input type="hidden" name="precio" value={price} />}
      <label className="relative min-w-0 flex-1 basis-56">
        <span className="sr-only">Buscar productos</span>
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-carbon-suave" />
        <input
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Buscar: cera de soja, molde oso, vainilla…"
          className="w-full rounded-full border-2 border-carbon bg-crema-claro py-2.5 pr-4 pl-10 text-sm outline-none focus:shadow-[3px_3px_0_var(--color-carbon)]"
        />
      </label>
      <label className="flex items-center gap-2 text-sm font-semibold">
        <span className="sr-only sm:not-sr-only">Ordenar</span>
        <select
          name="orden"
          defaultValue={sort ?? "destacados"}
          className="cursor-pointer rounded-full border-2 border-carbon bg-crema-claro px-3 py-2.5 text-sm font-semibold"
        >
          {Object.entries(SORTS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex cursor-pointer items-center gap-2 rounded-full border-2 border-carbon bg-crema-claro px-3 py-2.5 text-sm font-semibold">
        <input type="checkbox" name="disponibles" value="1" defaultChecked={available} className="size-4 accent-carbon" />
        Solo disponibles
      </label>
      <noscript>
        <button type="submit" className="rounded-full bg-carbon px-4 py-2.5 text-sm font-bold text-crema">
          Aplicar
        </button>
      </noscript>
    </form>
  );
}
