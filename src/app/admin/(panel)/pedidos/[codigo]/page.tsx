import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { WhatsAppIcon } from "@/components/ui/icons";
import { requireAdmin } from "@/lib/auth/session";
import { formatCOP } from "@/lib/format";
import { confirmCodAction, deliverAction, resendEmail, retryRemision } from "@/app/admin/order-actions";
import { CancelCod, LocalDispatch } from "@/components/admin/LocalDispatch";
import { describeDay, formatDay } from "@/lib/shop/calendar";
import { getShippingSettings } from "@/lib/shop/shipping";
import { remisionesMode } from "@/lib/effi/sales";
import { ShipForm } from "@/components/admin/ShipForm";
import { emailStatus } from "@/lib/email/order-emails";
import { EMAIL_LABELS, type EmailKind } from "@/lib/email/templates";
import { getOrder, LEGAL_ID_TYPES, usedCarriers } from "@/lib/shop/orders";
import { statusInfo } from "@/lib/shop/status";

export const metadata: Metadata = { title: "Pedido" };

const dateFmt = new Intl.DateTimeFormat("es-CO", { dateStyle: "long", timeStyle: "short", timeZone: "America/Bogota" });

export default async function PedidoAdmin({ params }: PageProps<"/admin/pedidos/[codigo]">) {
  await requireAdmin();
  const order = await getOrder((await params).codigo);
  if (!order) notFound();
  const s = statusInfo(order.status);
  const [carriers, emails, shipping] = await Promise.all([usedCarriers(), emailStatus(order.id), getShippingSettings()]);
  const local = order.shippingZone !== "nacional";
  const pickup = order.shippingZone === "recoger";
  const cod = order.paymentType === "contraentrega";
  // Venta confirmada: pagada en línea o contraentrega
  const confirmed = ["pagado", "contraentrega", "despachado", "entregado"].includes(order.status);
  const canShip = local ? ["pagado", "contraentrega", "despachado"].includes(order.status) : ["pagado", "despachado"].includes(order.status);
  const kinds: EmailKind[] =
    order.status === "rechazado"
      ? ["pago_fallido"]
      : ["despachado", "entregado"].includes(order.status)
        ? ["confirmacion", "venta", "despacho"]
        : confirmed
          ? ["confirmacion", "venta"]
          : [];
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
      <p className="-mt-3 text-sm">
        <strong>{pickup ? "Recoge en el punto de entrega" : local ? "Domicilio Lusarte" : "Envío nacional (flete al cobro)"}</strong>
        {local && order.scheduledFor && ` · programada para ${describeDay(order.scheduledFor)} (${formatDay(order.scheduledFor)})`}
        {" · "}
        {cod ? <strong>Contraentrega: cobrar {formatCOP(order.total)}</strong> : "Pagado en línea"}
        {order.deliveredAt && ` · entregado el ${dateFmt.format(order.deliveredAt)}`}
      </p>
      {order.stockAlert && (
        <p role="alert" className="toon rounded-2xl bg-alerta px-4 py-3 text-sm font-bold text-crema">
          Se vendió más de lo que había en stock (dos pagos casi al tiempo). Revisa el inventario en Effi o escríbele al cliente.
        </p>
      )}

      {order.status === "por_confirmar" && (
        <section className="toon toon-shadow grid gap-3 rounded-[1.25rem] bg-miel/50 p-5 text-sm">
          <h2 className="font-display text-lg font-extrabold">Contraentrega por confirmar</h2>
          <p>
            Escríbele al cliente por WhatsApp para confirmar el pedido y {pickup ? "coordinar dónde y cuándo lo recoge" : "la dirección de entrega"}. Al confirmar se programa
            la entrega, se aparta el inventario, se crea la remisión en Effi y le llega la confirmación por correo.
          </p>
          <form action={confirmCodAction.bind(null, order.code!)}>
            <button type="submit" className="toon toon-press cursor-pointer rounded-full bg-estrella px-5 py-2.5 font-bold">
              Confirmar pedido
            </button>
          </form>
          <CancelCod code={order.code!} />
        </section>
      )}

      {canShip && local && (
        <section className={`toon grid gap-4 rounded-[1.25rem] p-5 ${order.status !== "despachado" ? "toon-shadow bg-estrella/40" : "bg-crema-claro"}`}>
          <div>
            <h2 className="font-display text-lg font-extrabold">
              {pickup ? (order.status === "despachado" ? "Listo para recoger" : "Preparar para recoger") : order.status === "despachado" ? "En camino" : "Despacho local"}
            </h2>
            {order.shippedAt && (
              <p className="text-sm text-carbon-suave">
                Salió el {dateFmt.format(order.shippedAt)} · {order.deliveryWindow}
              </p>
            )}
          </div>
          <LocalDispatch
            code={order.code!}
            pickup={pickup}
            windows={shipping.local.windows}
            shipped={order.status === "despachado"}
            initial={{ window: order.deliveryWindow, note: order.shippingNote }}
          />
          <form action={deliverAction.bind(null, order.code!)} className="grid gap-1 border-t-2 border-carbon/10 pt-4">
            <button type="submit" className="toon toon-press cursor-pointer justify-self-start rounded-full bg-oliva/60 px-5 py-2.5 text-sm font-bold">
              {cod ? `Entregado y cobrado (${formatCOP(order.total)})` : "Marcar como entregado"}
            </button>
            {cod && (
              <p className="text-xs text-carbon-suave">
                {order.effiRemisionId
                  ? `Después registra el cobro en Effi, en la remisión N.º ${order.effiRemisionId} (queda como pendiente de cobro).`
                  : "Registra la venta y el cobro en Effi."}
              </p>
            )}
          </form>
          {cod && <CancelCod code={order.code!} />}
        </section>
      )}

      {canShip && !local && (
        <section className={`toon grid gap-4 rounded-[1.25rem] p-5 ${order.status === "pagado" ? "toon-shadow bg-estrella/40" : "bg-crema-claro"}`}>
          <div>
            <h2 className="font-display text-lg font-extrabold">{order.status === "pagado" ? "Despachar" : "Despacho"}</h2>
            {order.shippedAt && <p className="text-sm text-carbon-suave">Despachado el {dateFmt.format(order.shippedAt)}. Puedes corregir la guía.</p>}
          </div>
          <ShipForm
            code={order.code!}
            carriers={carriers}
            shipped={order.status === "despachado"}
            initial={{ carrier: order.carrier, trackingNumber: order.trackingNumber, trackingUrl: order.trackingUrl, shippingNote: order.shippingNote }}
          />
        </section>
      )}

      <section className="toon grid gap-2 rounded-[1.25rem] bg-crema-claro p-5 text-sm">
        <h2 className="font-display text-lg font-extrabold">Cliente</h2>
        <p>
          <strong>{order.name}</strong>
          {order.legalId && ` · ${LEGAL_ID_TYPES[String(order.legalIdType) as keyof typeof LEGAL_ID_TYPES] ?? "Documento"} ${order.legalId}`}
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
            <dd className="tabular-nums">{!local ? "Al cobro" : pickup ? "Recoge" : formatCOP(order.shipping)}</dd>
          </div>
          <div className="flex justify-between text-base font-bold">
            <dt>Total</dt>
            <dd className="tabular-nums">{formatCOP(order.total)}</dd>
          </div>
        </dl>
      </section>

      {(confirmed || order.status === "cancelado") && (
        <section className="toon grid gap-2 rounded-[1.25rem] bg-crema-claro p-5 text-sm">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-lg font-extrabold">Effi</h2>
            {confirmed && (
              <a href={`/admin/pedidos/${order.code}/comprobante`} target="_blank" className="font-semibold underline-offset-4 hover:underline">
                Comprobante en PDF
              </a>
            )}
          </div>
          {order.status === "cancelado" ? (
            <p>{order.effiRemisionId ? `Remisión N.º ${order.effiRemisionId} anulada en Effi (el inventario volvió).` : "Pedido anulado (no tenía remisión en Effi)."}</p>
          ) : order.effiRemisionId ? (
            <p>
              Remisión de venta <strong>N.º {order.effiRemisionId}</strong>
              {cod ? ", pendiente de cobro (Contado a 1 día)" : ""}. El inventario ya se descontó en Effi.
              {(order.trackingNumber || order.deliveryWindow) && " La entrega quedó anotada en su observación."}
            </p>
          ) : (
            <>
              <p className="font-semibold text-alerta">Sin remisión en Effi.</p>
              {order.effiRemisionError && <p className="text-xs text-carbon-suave">{order.effiRemisionError}</p>}
              {remisionesMode().on ? (
                <form action={retryRemision.bind(null, order.code!)}>
                  <button type="submit" className="toon toon-press cursor-pointer rounded-full bg-estrella px-4 py-2 font-bold">
                    Crear remisión en Effi
                  </button>
                </form>
              ) : (
                <p className="text-xs text-carbon-suave">Créala a mano en Effi si es una venta real.</p>
              )}
            </>
          )}
        </section>
      )}

      <section className="toon grid gap-1 rounded-[1.25rem] bg-crema-claro p-5 text-sm">
        <h2 className="font-display text-lg font-extrabold">Pago</h2>
        <p>Creado: {dateFmt.format(order.createdAt)}</p>
        {order.paidAt && <p>Pagado: {dateFmt.format(order.paidAt)}</p>}
        {cod ? (
          <p>Contraentrega: {order.status === "entregado" ? "cobrado al entregar" : `cobrar ${formatCOP(order.total)} al entregar`}.</p>
        ) : (
          <p>
            Wompi: {order.wompiTransactionId ?? "sin transacción"} {order.wompiStatus && `(${order.wompiStatus})`}
            {order.paymentMethod && ` · ${order.paymentMethod}`}
          </p>
        )}
      </section>

      {kinds.length > 0 && (
        <section className="toon grid gap-3 rounded-[1.25rem] bg-crema-claro p-5 text-sm">
          <h2 className="font-display text-lg font-extrabold">Correos</h2>
          <ul className="grid gap-3">
            {kinds.map((kind) => {
              const log = emails.get(kind);
              const state = !log
                ? { label: "Pendiente", tint: "bg-carbon/10" }
                : log.status === "enviado"
                  ? { label: "Enviado", tint: "bg-oliva/50" }
                  : log.status === "sin_configurar"
                    ? { label: "Brevo sin configurar", tint: "bg-miel/60" }
                    : { label: "Falló", tint: "bg-alerta text-crema" };
              return (
                <li key={kind} className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="font-semibold">{EMAIL_LABELS[kind]}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${state.tint}`}>{state.label}</span>
                  {log && (
                    <span className="text-xs text-carbon-suave">
                      {dateFmt.format(log.createdAt)} · {log.recipient}
                    </span>
                  )}
                  <span className="ml-auto flex gap-3">
                    <a href={`/admin/pedidos/${order.code}/correo/${kind}`} target="_blank" className="font-semibold underline-offset-4 hover:underline">
                      Ver
                    </a>
                    <form action={resendEmail.bind(null, order.code!, kind)}>
                      <button type="submit" className="cursor-pointer font-semibold underline-offset-4 hover:underline">
                        {log ? "Reenviar" : "Enviar"}
                      </button>
                    </form>
                  </span>
                  {log?.error && log.status !== "enviado" && <p className="w-full text-xs text-alerta">{log.error}</p>}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
