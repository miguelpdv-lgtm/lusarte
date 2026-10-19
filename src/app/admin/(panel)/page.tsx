import Link from "next/link";
import type { ReactNode } from "react";
import { BarChart } from "@/components/admin/BarChart";
import { SyncCard } from "@/components/admin/SyncCard";
import { requireAdmin } from "@/lib/auth/session";
import { loadProducts } from "@/lib/catalog/queries";
import { ADMIN_FILTERS, isLow, type AdminFilter } from "@/lib/catalog/status";
import { db } from "@/lib/db";
import { getState } from "@/lib/effi/sync";
import { formatCOP } from "@/lib/format";
import { storeStatus } from "@/lib/setup-check";
import { salesStats, type Period } from "@/lib/stats";

export const dynamic = "force-dynamic";

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const monthLabel = (key: string) => `${MONTHS[Number(key.slice(5, 7)) - 1]} ${key.slice(2, 4)}`;
const dayLabel = (key: string) => `${Number(key.slice(8, 10))} ${MONTHS[Number(key.slice(5, 7)) - 1]}`;

function change(now: Period, before: Period) {
  if (!before.total) return null;
  const pct = Math.round(((now.total - before.total) / before.total) * 100);
  return `${pct >= 0 ? "+" : ""}${pct}% vs. 30 días anteriores`;
}

export default async function PanelInicio() {
  await requireAdmin();
  const [products, stats, articles, sales, status] = await Promise.all([
    loadProducts(),
    salesStats(),
    getState(db, "articles"),
    getState(db, "sales"),
    storeStatus(),
  ]);

  const counts = Object.fromEntries(Object.entries(ADMIN_FILTERS).map(([k, f]) => [k, products.filter(f.test).length])) as Record<AdminFilter, number>;
  const visible = products.filter((p) => p.visible && p.category).length;
  const lowStock = products
    .flatMap((p) => p.options.filter((o) => !o.hidden && (isLow(o) || o.stock === 0)).map((o) => ({ product: p, option: o })))
    .sort((a, b) => (a.option.stock ?? 0) - (b.option.stock ?? 0))
    .slice(0, 8);

  return (
    <div className="grid grid-cols-1 gap-8">
      <div>
        <h1 className="font-display text-3xl font-extrabold">Hola</h1>
        <p className="mt-1 text-carbon-suave">Así va Lusarte. Las ventas son las remisiones registradas en Effi.</p>
      </div>

      <section aria-labelledby="estado" className="toon grid gap-3 rounded-[1.25rem] bg-crema-claro p-5">
        <h2 id="estado" className="font-display text-lg font-extrabold">
          Estado de la tienda
        </h2>
        <ul className="grid gap-2 text-sm">
          {status.map((i) => (
            <li key={i.label} className="grid gap-0.5 sm:grid-cols-[11rem_1fr]">
              <span className="font-bold">{i.label}</span>
              <span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${i.ok ? "bg-oliva/50" : "bg-miel"}`}>{i.value}</span>
                {i.hint && <span className="mt-0.5 block text-xs text-carbon-suave">{i.hint}</span>}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <SyncCard
        statuses={[
          { label: "Productos y stock", at: articles?.at ?? null, ok: articles?.ok ?? false, detail: articles?.error ?? articles?.detalle ?? null },
          { label: "Ventas", at: sales?.at ?? null, ok: sales?.ok ?? false, detail: sales?.error ?? sales?.detalle ?? null },
        ]}
      />

      <section aria-labelledby="ventas" className="grid gap-4">
        <h2 id="ventas" className="font-display text-xl font-extrabold">
          Ventas
        </h2>
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi label="Últimos 30 días" value={formatCOP(stats.last30.total)} note={change(stats.last30, stats.prev30)} strong />
          <Kpi label="Ventas en 30 días" value={String(stats.last30.count)} note={`Ticket promedio ${formatCOP(stats.last30.avg)}`} />
          <Kpi label="Este mes" value={formatCOP(stats.thisMonth.total)} note={`${stats.thisMonth.count} ventas`} />
          <Kpi label="Hoy" value={formatCOP(stats.today.total)} note={`${stats.today.count} ventas`} />
        </ul>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="Por mes · últimos 12 meses">
            <BarChart bars={stats.months.map((m) => ({ key: m.key, label: monthLabel(m.key), value: m.total, count: m.count }))} />
          </Card>
          <Card title="Por día · últimos 30 días">
            <BarChart bars={stats.days.map((d) => ({ key: d.key, label: dayLabel(d.key), value: d.total, count: d.count }))} />
          </Card>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card title="Mejores clientes · 30 días">
            <Ranking rows={stats.topClients} />
          </Card>
          <Card title="Ciudades · 30 días">
            <Ranking rows={stats.topCities} />
          </Card>
        </div>
        <p className="text-xs text-carbon-suave">
          Ventas de la tienda web en 30 días: {formatCOP(stats.web30.total)} ({stats.web30.count}). Se llenará cuando estén activos los pagos en línea.
        </p>
      </section>

      <section aria-labelledby="catalogo" className="grid gap-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="catalogo" className="font-display text-xl font-extrabold">
            Catálogo
          </h2>
          <Link href="/admin/productos" className="text-sm font-bold underline-offset-4 hover:underline">
            Ver productos →
          </Link>
        </div>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          <Stat href="/admin/productos" label="En la tienda" value={visible} />
          {(Object.keys(ADMIN_FILTERS) as AdminFilter[]).map((k) => (
            <Stat key={k} href={`/admin/productos?estado=${k}`} label={ADMIN_FILTERS[k].label} value={counts[k]} warn={k !== "ocultos" && counts[k] > 0} />
          ))}
        </ul>

        {lowStock.length > 0 && (
          <Card title="Stock bajo o agotado (según Effi)">
            <ul className="divide-y divide-carbon/10 text-sm">
              {lowStock.map(({ product, option }) => (
                <li key={option.id} className="flex items-center justify-between gap-3 py-2">
                  <Link href={`/admin/productos/${product.id}`} className="min-w-0 truncate font-semibold hover:underline">
                    {option.effiName}
                  </Link>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold tabular-nums ${option.stock === 0 ? "bg-carbon text-crema" : "bg-miel"}`}>
                    {option.stock === 0 ? "Agotado" : `${option.stock} und`}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </section>
    </div>
  );
}

function Kpi({ label, value, note, strong = false }: { label: string; value: string; note?: string | null; strong?: boolean }) {
  return (
    <li className={`toon rounded-2xl p-4 ${strong ? "bg-lavanda" : "bg-crema-claro"}`}>
      <span className="text-sm font-semibold text-carbon-suave">{label}</span>
      <span className="mt-1 block font-display text-2xl font-extrabold tabular-nums sm:text-3xl">{value}</span>
      {note && <span className="mt-1 block text-xs font-semibold text-carbon-suave">{note}</span>}
    </li>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="toon rounded-[1.5rem] bg-crema-claro p-4 sm:p-5">
      <h3 className="mb-3 text-sm font-bold">{title}</h3>
      {children}
    </div>
  );
}

function Ranking({ rows }: { rows: { name: string; total: number; count: number }[] }) {
  if (!rows.length) return <p className="text-sm text-carbon-suave">Sin ventas en este periodo.</p>;
  const max = rows[0].total || 1;
  return (
    <ol className="grid gap-2 text-sm">
      {rows.map((r) => (
        <li key={r.name} className="grid gap-1">
          <div className="flex justify-between gap-3">
            <span className="truncate font-semibold">{r.name}</span>
            <span className="shrink-0 tabular-nums">
              {formatCOP(r.total)} <span className="text-xs text-carbon-suave">· {r.count}</span>
            </span>
          </div>
          <span className="h-1.5 rounded-full bg-uva" style={{ width: `${(r.total / max) * 100}%` }} aria-hidden="true" />
        </li>
      ))}
    </ol>
  );
}

function Stat({ href, label, value, warn = false }: { href: string; label: string; value: number; warn?: boolean }) {
  return (
    <li>
      <Link href={href} className={`toon block rounded-2xl p-3 transition-transform hover:-translate-y-0.5 ${warn ? "bg-miel/70" : "bg-crema-claro"}`}>
        <span className="block font-display text-2xl font-extrabold tabular-nums">{value}</span>
        <span className="text-xs font-semibold text-carbon-suave">{label}</span>
      </Link>
    </li>
  );
}
