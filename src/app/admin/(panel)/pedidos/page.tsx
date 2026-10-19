import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { formatCOP } from "@/lib/format";
import { describeDay } from "@/lib/shop/calendar";
import { listOrders, type OrderStatus } from "@/lib/shop/orders";
import { statusInfo } from "@/lib/shop/status";

export const metadata: Metadata = { title: "Pedidos" };

type Tab = { key: string; label: string; statuses?: OrderStatus[]; zone?: "local" | "nacional"; hint?: string };

const tabs: Tab[] = [
  {
    key: "",
    label: "Despacho local",
    statuses: ["por_confirmar", "pagado", "contraentrega", "despachado"],
    zone: "local",
    hint: "Domicilios y pedidos para recoger. Primero las contraentregas por confirmar; luego por fecha de entrega. Al entregar, márcalos como entregados.",
  },
  { key: "nacional", label: "Despacho nacional", statuses: ["pagado"], zone: "nacional", hint: "Pagados, por despachar con transportadora." },
  { key: "despachados", label: "Despachados", statuses: ["despachado", "entregado"] },
  { key: "todos", label: "Todos" },
];

const dateFmt = new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Bogota" });

export default async function PedidosAdmin({ searchParams }: PageProps<"/admin/pedidos">) {
  await requireAdmin();
  const sp = await searchParams;
  const tab = tabs.find((t) => t.key && t.key === sp.ver) ?? tabs[0];
  let orders = await listOrders({ statuses: tab.statuses, zone: tab.zone });
  // Despacho local: por fecha de entrega (los que ya salieron, al final)
  if (tab.zone === "local")
    orders = orders.toSorted(
      (a, b) =>
        Number(b.status === "por_confirmar") - Number(a.status === "por_confirmar") ||
        Number(a.status === "despachado") - Number(b.status === "despachado") ||
        (a.scheduledFor ?? "").localeCompare(b.scheduledFor ?? ""),
    );

  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-extrabold">Pedidos</h1>
        <Link href="/admin/envios" className="text-sm font-semibold underline-offset-4 hover:underline">
          Tarifas y horarios de envío
        </Link>
      </div>
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
      {tab.hint && <p className="-mt-3 text-sm text-carbon-suave">{tab.hint}</p>}

      {orders.length === 0 ? (
        <p className="toon rounded-2xl bg-crema-claro px-4 py-8 text-center text-carbon-suave">No hay pedidos aquí.</p>
      ) : (
        <ul className="toon divide-y-2 divide-carbon/10 overflow-hidden rounded-[1.25rem] bg-crema-claro">
          {orders.map((o) => {
            const s = statusInfo(o.status);
            const when = o.shippingZone !== "nacional" && o.scheduledFor ? describeDay(o.scheduledFor) : null;
            return (
              <li key={o.id}>
                <Link href={`/admin/pedidos/${o.code}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 hover:bg-lavanda/40">
                  <span className="font-bold tabular-nums">{o.code}</span>
                  <span className="min-w-0 flex-1 truncate">
                    {o.name} · {o.city}
                  </span>
                  {when && o.status !== "entregado" && (
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${when === "hoy" ? "bg-estrella" : "bg-white"} border border-carbon/30`}>
                      Entrega {when}
                      {o.deliveryWindow && ` · ${o.deliveryWindow}`}
                    </span>
                  )}
                  {o.shippingZone === "recoger" && <span className="rounded-full border border-carbon/30 bg-white px-2.5 py-0.5 text-xs font-bold">Para recoger</span>}
                  {o.paymentType === "contraentrega" && o.status !== "entregado" && o.status !== "cancelado" && (
                    <span className="rounded-full bg-carbon px-2.5 py-0.5 text-xs font-bold text-crema">Cobrar {formatCOP(o.total)}</span>
                  )}
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
