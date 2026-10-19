import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { WhatsAppIcon } from "@/components/ui/icons";
import { requireAdmin } from "@/lib/auth/session";
import { formatCOP } from "@/lib/format";
import { getOrder } from "@/lib/shop/orders";
import { statusInfo } from "@/lib/shop/status";

export const metadata: Metadata = { title: "Pedido" };

const dateFmt = new Intl.DateTimeFormat("es-CO", { dateStyle: "long", timeStyle: "short", timeZone: "America/Bogota" });

// TODO(fase 8): botón Despachar (transportadora, guía, link de rastreo) y correo al cliente.
export default async function PedidoAdmin({ params }: PageProps<"/admin/pedidos/[codigo]">) {
  await requireAdmin();
  const order = await getOrder((await params).codigo);
  if (!order) notFound();
  const s = statusInfo(order.status);
  const address = `${order.address}${order.addressNotes ? ` (${order.addressNotes})` : ""}, ${order.city}, ${order.department}`;
  const greeting = `¡Hola ${order.name.split(" ")[0]}! Te escribimos de Lusarte por tu pedido ${order.code}.`;

  return (
    <div className="grid max-w-3xl grid-cols-1 gap-6">
      <Link href="/admin/pedidos" className="text-sm font-semibold underline-offset-4 hover:underline">
        ← Pedidos
      </Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-3xl font-extrabold">{order.code}</h1>
        <span className={`rounded-full px-3 py-1 text-sm font-bold ${s.tint}`}>{s.label}</span>
      </div>
      {order.stockAlert && (
        <p role="alert" className="toon rounded-2xl bg-alerta px-4 py-3 text-sm font-bold text-crema">
          Se vendió más de lo que había en stock (dos pagos casi al tiempo). Revisa el inventario en Effi o escríbele al cliente.
        </p>
      )}

      <section className="toon grid gap-2 rounded-[1.25rem] bg-crema-claro p-5 text-sm">
        <h2 className="font-display text-lg font-extrabold">Cliente</h2>
        <p>
          <strong>{order.name}</strong>
          {order.legalId && ` · CC ${order.legalId}`}
        </p>
        <p>
          <a href={`mailto:${order.email}`} className="underline">
            {order.email}
          </a>{" "}
          · {order.phone}
        </p>
        <p>{address}</p>
        <a
          href={`https://wa.me/57${order.phone}?text=${encodeURIComponent(greeting)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="toon toon-press mt-2 inline-flex items-center gap-2 justify-self-start rounded-full bg-estrella px-4 py-2 font-bold"
        >
          <WhatsAppIcon className="size-4" /> Escribir por WhatsApp
        </a>
      </section>

      <section className="toon grid gap-3 rounded-[1.25rem] bg-crema-claro p-5 text-sm">
        <h2 className="font-display text-lg font-extrabold">Productos</h2>
        <ul className="grid gap-2">
          {order.items.map((i) => (
            <li key={i.id} className="flex justify-between gap-3">
              <span>
                <strong>{i.quantity} ×</strong> {i.productName}
                {i.optionName && ` · ${i.optionName}`}
                {i.note && <span className="block text-xs text-carbon-suave">Personalización: {i.note}</span>}
              </span>
              <span className="shrink-0 font-bold tabular-nums">{formatCOP(i.unitPrice * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <dl className="grid gap-1 border-t-2 border-carbon/10 pt-3">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd className="tabular-nums">{formatCOP(order.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Envío</dt>
            <dd className="tabular-nums">{formatCOP(order.shipping)}</dd>
          </div>
          <div className="flex justify-between text-base font-bold">
            <dt>Total</dt>
            <dd className="tabular-nums">{formatCOP(order.total)}</dd>
          </div>
        </dl>
      </section>

      <section className="toon grid gap-1 rounded-[1.25rem] bg-crema-claro p-5 text-sm">
        <h2 className="font-display text-lg font-extrabold">Pago</h2>
        <p>Creado: {dateFmt.format(order.createdAt)}</p>
        {order.paidAt && <p>Pagado: {dateFmt.format(order.paidAt)}</p>}
        <p>
          Wompi: {order.wompiTransactionId ?? "sin transacción"} {order.wompiStatus && `(${order.wompiStatus})`}
          {order.paymentMethod && ` · ${order.paymentMethod}`}
        </p>
      </section>
    </div>
  );
}
