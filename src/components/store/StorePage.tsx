import { syncEffiIfStale } from "@/lib/effi/auto";
import Link from "next/link";
import type { ReactNode } from "react";
import { ProductCard } from "@/components/ui/ProductCard";
import { filterProducts, PRICE_RANGES, type Filters } from "@/lib/catalog/filters";
import { filtersHref } from "@/lib/catalog/params";
import { getCatalog } from "@/lib/catalog/queries";
import { whatsappUrl } from "@/lib/site";
import { Breadcrumbs, type Crumb } from "./Breadcrumbs";
import { StoreFilters } from "./StoreFilters";

type Props = {
  path: string;
  title: string;
  intro?: ReactNode;
  crumbs: Crumb[];
  /** Filtros fijos de la página (categoría, subcategoría, colección) */
  scope: Pick<Filters, "category" | "subcategory" | "navidad">;
  /** Filtros que vienen de la URL */
  filters: Filters;
  /** Chips de navegación bajo el título (subcategorías, categorías) */
  chips?: { href: string; label: string; active?: boolean }[];
  tint?: string;
};

export async function StorePage({ path, title, intro, crumbs, scope, filters, chips, tint = "bg-lavanda" }: Props) {
  syncEffiIfStale();
  const result = filterProducts(await getCatalog(), { ...filters, ...scope });
  const hasFilters = Boolean(filters.q || filters.price || filters.available);

  return (
    <>
      <header className={`wave-bottom ${tint} px-4 pt-8 pb-14 sm:px-6 sm:pt-10 lg:px-8`}>
        <div className="mx-auto max-w-7xl">
          <Breadcrumbs items={crumbs} />
          <h1 className="mt-3 font-hand text-[2.5rem] leading-none text-balance sm:text-5xl">{title}</h1>
          {intro && <div className="mt-3 max-w-2xl leading-relaxed text-carbon/85">{intro}</div>}
          {chips && chips.length > 0 && (
            <nav aria-label="Secciones" className="mt-5 flex flex-wrap gap-2">
              {chips.map((c) => (
                <Link
                  key={c.href}
                  href={c.href}
                  aria-current={c.active ? "page" : undefined}
                  className={`toon rounded-full px-3.5 py-1.5 text-sm font-bold transition-colors ${c.active ? "bg-carbon text-crema" : "bg-crema-claro hover:bg-estrella"}`}
                >
                  {c.label}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 pt-6 pb-20 sm:px-6 lg:px-8">
        <StoreFilters q={filters.q} sort={filters.sort} available={filters.available} price={filters.price} />

        <nav aria-label="Filtrar por precio" className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <span className="font-semibold text-carbon-suave">Precio:</span>
          {PRICE_RANGES.map((r) => {
            const active = filters.price === r.slug;
            return (
              <Link
                key={r.slug}
                href={filtersHref(path, filters, { precio: active ? null : r.slug })}
                aria-current={active ? "true" : undefined}
                className={`rounded-full border-2 px-3 py-1 font-semibold transition-colors ${active ? "border-carbon bg-carbon text-crema" : "border-carbon/25 hover:border-carbon"}`}
              >
                {r.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-6 flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-sm text-carbon-suave" role="status">
            {result.total} {result.total === 1 ? "producto" : "productos"}
            {filters.q && (
              <>
                {" "}
                para “<strong className="text-carbon">{filters.q}</strong>”
              </>
            )}
          </p>
          {hasFilters && (
            <Link href={path} className="text-sm font-bold underline decoration-2 underline-offset-4">
              Quitar filtros
            </Link>
          )}
        </div>

        {result.items.length === 0 ? (
          <div className="toon mx-auto mt-10 max-w-lg rounded-[1.75rem] bg-crema-claro p-8 text-center">
            <p className="font-hand text-3xl">No encontramos nada</p>
            <p className="mt-2 text-carbon-suave">Prueba con otra palabra o quita los filtros. Si buscas algo especial, pregúntanos.</p>
            <a
              href={whatsappUrl(`¡Hola Lusarte! Estoy buscando ${filters.q ? `"${filters.q}"` : "un producto"}.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="toon toon-press mt-5 inline-flex rounded-full bg-estrella px-5 py-2.5 text-sm font-bold"
            >
              Preguntar por WhatsApp
            </a>
          </div>
        ) : (
          <ul className="mt-6 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-6 sm:gap-y-10 lg:grid-cols-4">
            {result.items.map((p) => (
              <li key={p.id} className="flex">
                <ProductCard product={p} />
              </li>
            ))}
          </ul>
        )}

        {result.pages > 1 && (
          <nav aria-label="Páginas" className="mt-12 flex flex-wrap items-center justify-center gap-2">
            {result.page > 1 && <PageLink href={filtersHref(path, filters, { pagina: String(result.page - 1) })}>← Anterior</PageLink>}
            {Array.from({ length: result.pages }, (_, i) => i + 1).map((n) => (
              <PageLink key={n} href={filtersHref(path, filters, { pagina: n === 1 ? null : String(n) })} active={n === result.page}>
                {n}
              </PageLink>
            ))}
            {result.page < result.pages && <PageLink href={filtersHref(path, filters, { pagina: String(result.page + 1) })}>Siguiente →</PageLink>}
          </nav>
        )}
      </div>
    </>
  );
}

function PageLink({ href, active, children }: { href: string; active?: boolean; children: ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`grid min-w-10 place-items-center rounded-full border-2 border-carbon px-3 py-1.5 text-sm font-bold tabular-nums ${active ? "bg-carbon text-crema" : "bg-crema-claro hover:bg-estrella"}`}
    >
      {children}
    </Link>
  );
}
