import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { categories } from "@/data/catalog";
import { requireAdmin } from "@/lib/auth/session";
import { loadProducts } from "@/lib/catalog/queries";
import { ADMIN_FILTERS, type AdminFilter } from "@/lib/catalog/status";
import { formatCOP } from "@/lib/format";

export const metadata: Metadata = { title: "Productos" };

const categoryName = new Map(categories.map((c) => [c.slug, c.short]));

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

export default async function ProductosAdmin({ searchParams }: PageProps<"/admin/productos">) {
  await requireAdmin();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const estado = (typeof sp.estado === "string" && sp.estado in ADMIN_FILTERS ? sp.estado : null) as AdminFilter | null;
  const categoria = typeof sp.categoria === "string" ? sp.categoria : "";

  let list = await loadProducts();
  if (estado) list = list.filter(ADMIN_FILTERS[estado].test);
  if (categoria) list = list.filter((p) => p.category === categoria);
  if (q.trim()) {
    const words = norm(q).split(/\s+/).filter(Boolean);
    // Busca en el nombre web y en el nombre/referencia de cada artículo de Effi
    list = list.filter((p) => {
      const haystack = norm(`${p.name} ${p.options.map((o) => `${o.effiName} ${o.referencia ?? ""}`).join(" ")}`);
      return words.every((w) => haystack.includes(w));
    });
  }
  list.sort((a, b) => (a.category ?? "").localeCompare(b.category ?? "") || a.name.localeCompare(b.name));

  const linkWith = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams();
    const merged = { q: q || null, estado, categoria: categoria || null, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) next.set(k, v);
    const s = next.toString();
    return s ? `/admin/productos?${s}` : "/admin/productos";
  };

  return (
    <div className="grid grid-cols-1 gap-6">
      {sp.anulado && (
        <p role="status" className="toon rounded-2xl bg-oliva/40 px-4 py-3 text-sm font-semibold">
          Producto anulado en Effi y retirado de la tienda.
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-extrabold">Productos</h1>
        <Link href="/admin/productos/nuevo" className="toon toon-press rounded-full bg-estrella px-5 py-2.5 text-sm font-bold">
          + Nuevo producto
        </Link>
      </div>

      <form className="flex flex-wrap gap-2" role="search">
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar por nombre o referencia"
          aria-label="Buscar por nombre o referencia"
          className="min-w-0 flex-1 rounded-full border-2 border-carbon/80 bg-white px-4 py-2 text-sm"
        />
        <select
          name="categoria"
          defaultValue={categoria}
          aria-label="Categoría"
          className="rounded-full border-2 border-carbon/80 bg-white px-3 py-2 text-sm"
        >
          <option value="">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.short}
            </option>
          ))}
        </select>
        {estado && <input type="hidden" name="estado" value={estado} />}
        <button type="submit" className="cursor-pointer rounded-full bg-carbon px-4 py-2 text-sm font-bold text-crema">
          Buscar
        </button>
      </form>

      <nav aria-label="Filtrar por estado" className="-mt-2 flex flex-wrap gap-2 text-sm">
        <Chip href={linkWith({ estado: null })} active={!estado}>
          Todos
        </Chip>
        {(Object.keys(ADMIN_FILTERS) as AdminFilter[]).map((k) => (
          <Chip key={k} href={linkWith({ estado: k })} active={estado === k}>
            {ADMIN_FILTERS[k].label}
          </Chip>
        ))}
      </nav>

      <p className="text-sm text-carbon-suave">
        {list.length} {list.length === 1 ? "producto" : "productos"}
      </p>

      {list.length === 0 ? (
        <p className="toon rounded-2xl bg-crema-claro p-6 text-center text-carbon-suave">No hay productos con estos filtros.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-2">
          {list.map((p) => {
            const prices = p.options.map((o) => o.price);
            const min = Math.min(...prices);
            const max = Math.max(...prices);
            return (
              <li key={p.id}>
                <Link
                  href={`/admin/productos/${p.id}`}
                  className="flex items-center gap-3 rounded-2xl border-2 border-carbon/15 bg-crema-claro p-2.5 transition-colors hover:border-carbon"
                >
                  <div className="relative size-14 shrink-0 overflow-hidden rounded-xl border-2 border-carbon/20 bg-lavanda/50">
                    {p.images[0] && <Image src={p.images[0].url} alt="" fill sizes="56px" className="object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{p.name}</p>
                    <p className="truncate text-xs text-carbon-suave">
                      {(p.category && categoryName.get(p.category)) || "Sin categoría"} · {p.options.length} {p.options.length === 1 ? "presentación" : "presentaciones"}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {!p.visible && <Tag className="bg-carbon text-crema">Oculto</Tag>}
                      {ADMIN_FILTERS.agotados.test(p) && <Tag className="bg-miel">Agotado</Tag>}
                      {ADMIN_FILTERS.pocas.test(p) && <Tag className="bg-estrella">Pocas unidades</Tag>}
                      {p.images.length === 0 && <Tag className="bg-lavanda">Sin foto</Tag>}
                      {!p.description.trim() && <Tag className="bg-cielo/60">Sin descripción</Tag>}
                      {!p.category && <Tag className="bg-carbon/20">Sin categoría en Effi</Tag>}
                    </div>
                  </div>
                  <p className="shrink-0 text-right text-sm font-bold tabular-nums">
                    {formatCOP(min)}
                    {max !== min && <span className="block text-xs font-semibold text-carbon-suave">a {formatCOP(max)}</span>}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Chip({ href, active, children }: { href: string; active: boolean; children: ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`rounded-full border-2 border-carbon px-3 py-1 font-semibold ${active ? "bg-carbon text-crema" : "bg-crema-claro hover:bg-lavanda"}`}
    >
      {children}
    </Link>
  );
}

function Tag({ className, children }: { className: string; children: ReactNode }) {
  return <span className={`rounded-full px-2 py-0.5 text-[0.7rem] font-bold ${className}`}>{children}</span>;
}
