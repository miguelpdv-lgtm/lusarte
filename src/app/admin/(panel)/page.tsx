import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { loadProducts } from "@/lib/catalog/queries";
import { ADMIN_FILTERS, type AdminFilter } from "@/lib/catalog/status";

export default async function PanelInicio() {
  await requireAdmin();
  const products = await loadProducts({ onlyVisible: false });
  const counts = Object.fromEntries(
    Object.entries(ADMIN_FILTERS).map(([k, f]) => [k, products.filter(f.test).length]),
  ) as Record<AdminFilter, number>;

  return (
    <div className="grid grid-cols-1 gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold">Hola 👋</h1>
          <p className="mt-1 text-carbon-suave">Esto es lo que hay en la tienda hoy.</p>
        </div>
        <Link href="/admin/productos/nuevo" className="toon toon-press rounded-full bg-estrella px-5 py-2.5 text-sm font-bold">
          + Nuevo producto
        </Link>
      </div>

      <section className="toon rounded-[1.5rem] bg-lavanda/60 p-5">
        <h2 className="font-display text-lg font-extrabold">Pedidos por despachar</h2>
        <p className="mt-1 text-sm text-carbon-suave">
          Aquí aparecerán los pedidos pagados cuando la tienda reciba pagos en línea (fase 8 del plan).
        </p>
      </section>

      <section aria-labelledby="productos-resumen">
        <h2 id="productos-resumen" className="font-display text-lg font-extrabold">
          Productos
        </h2>
        <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <Stat href="/admin/productos" label="En total" value={products.length} />
          {(Object.keys(ADMIN_FILTERS) as AdminFilter[]).map((k) => (
            <Stat key={k} href={`/admin/productos?estado=${k}`} label={ADMIN_FILTERS[k].label} value={counts[k]} warn={k !== "ocultos" && counts[k] > 0} />
          ))}
        </ul>
      </section>
    </div>
  );
}

function Stat({ href, label, value, warn = false }: { href: string; label: string; value: number; warn?: boolean }) {
  return (
    <li>
      <Link
        href={href}
        className={`toon block rounded-2xl p-4 transition-transform hover:-translate-y-0.5 ${warn ? "bg-miel/70" : "bg-crema-claro"}`}
      >
        <span className="block font-display text-3xl font-extrabold tabular-nums">{value}</span>
        <span className="text-sm font-semibold text-carbon-suave">{label}</span>
      </Link>
    </li>
  );
}
