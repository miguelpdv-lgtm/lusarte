import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { formatCOP } from "@/lib/format";
import { listOrders, type OrderStatus } from "@/lib/shop/orders";
import { statusInfo } from "@/lib/shop/status";

export const metadata: Metadata = { title: "Pedidos" };

const tabs: { key: string; label: string; statuses?: OrderStatus[] }[] = [
  { key: "", label: "Por despachar", statuses: ["pagado"] },
  { key: "despachados", label: "Despachados", statuses: ["despachado"] },
  { key: "todos", label: "Todos" },
];

const dateFmt = new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Bogota" });

export default async function PedidosAdmin({ searchParams }: PageProps<"/admin/pedidos">) {
  await requireAdmin();
  const sp = await searchParams;
  const tab = tabs.find((t) => t.key && t.key === sp.ver) ?? tabs[0];
  const orders = await listOrders(tab.statuses);

  return (
    <div className="grid grid-cols-1 gap-6">
      <h1 className="font-display text-3xl font-extrabold">Pedidos</h1>
      <nav aria-label="Filtro de pedidos" className="flex flex-wrap gap-2 text-sm font-bold">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={t.key ? `/admin/pedidos?ver=${t.key}` : "/admin/pedidos"}
            aria-current={t === tab ? "page" : undefined}
            className={`rounded-full border-2 border-carbon px-3.5 py-1.5 ${t === tab ? "bg-carbon text-crema" : "bg-crema-claro hover:bg-lavanda"}`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {orders.length === 0 ? (
        <p className="toon rounded-2xl bg-crema-claro px-4 py-8 text-center text-carbon-suave">No hay pedidos aquí.</p>
      ) : (
        <ul className="toon divide-y-2 divide-carbon/10 overflow-hidden rounded-[1.25rem] bg-crema-claro">
          {orders.map((o) => {
            const s = statusInfo(o.status);
            return (
              <li key={o.id}>
                <Link href={`/admin/pedidos/${o.code}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 hover:bg-lavanda/40">
                  <span className="font-bold tabular-nums">{o.code}</span>
                  <span className="min-w-0 flex-1 truncate">
                    {o.name} · {o.city}
                  </span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${s.tint}`}>{s.label}</span>
                  {o.stockAlert && <span className="rounded-full bg-alerta px-2.5 py-0.5 text-xs font-bold text-crema">Revisar inventario</span>}
                  <span className="font-bold tabular-nums">{formatCOP(o.total)}</span>
                  <span className="w-full text-xs text-carbon-suave sm:w-auto">{dateFmt.format(o.paidAt ?? o.createdAt)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
