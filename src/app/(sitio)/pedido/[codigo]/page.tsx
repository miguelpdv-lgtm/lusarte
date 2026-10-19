import { timingSafeEqual } from "node:crypto";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ClearCart } from "@/components/cart/ClearCart";
import { WhatsAppIcon } from "@/components/ui/icons";
import { formatCOP } from "@/lib/format";
import { applyTransaction, getOrder } from "@/lib/shop/orders";
import { fetchTransaction } from "@/lib/shop/wompi";
import { describeDay } from "@/lib/shop/calendar";
import { whatsappUrl } from "@/lib/site";

export const metadata: Metadata = { title: "Tu pedido", robots: { index: false } };
export const dynamic = "force-dynamic";

const sameToken = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

const statusCopy = {
  pendiente_pago: { title: "Estamos confirmando tu pago", text: "Wompi aún no nos confirma el pago. Si ya pagaste, recarga esta página en unos minutos.", tint: "bg-miel/60" },
  pagado: { title: "¡Gracias por tu compra!", text: "Recibimos tu pago. Te escribiremos cuando despachemos tu pedido, con la transportadora y el número de guía.", tint: "bg-oliva/40" },
  rechazado: { title: "El pago no se completó", text: "Tu banco o Wompi no aprobaron el pago y no se te cobró nada. Puedes intentarlo de nuevo desde el carrito.", tint: "bg-lavanda" },
  despachado: { title: "Tu pedido va en camino", text: "Ya lo despachamos. Con estos datos puedes seguirlo en la página de la transportadora.", tint: "bg-cielo/40" },
  por_confirmar: {
    title: "¡Recibimos tu pedido!",
    text: "Te escribimos por WhatsApp para confirmarlo y coordinar la entrega. Los pedidos están sujetos a disponibilidad.",
    tint: "bg-miel/60",
  },
  contraentrega: { title: "Pedido confirmado", text: "Pagas al recibirlo, en efectivo o por transferencia.", tint: "bg-oliva/40" },
  entregado: { title: "Pedido entregado", text: "¡Esperamos que lo disfrutes! Gracias por comprar en Lusarte.", tint: "bg-oliva/40" },
  cancelado: { title: "Pedido anulado", text: "Este pedido fue anulado. Si tienes dudas, escríbenos por WhatsApp.", tint: "bg-carbon/10" },
} as const;

export default async function PedidoPage({ params, searchParams }: PageProps<"/pedido/[codigo]">) {
  const { codigo } = await params;
  const sp = await searchParams;
  const token = typeof sp.t === "string" ? sp.t : "";
  let order = await getOrder(codigo);
  if (!order || !token || !sameToken(token, order.token)) notFound();

  // Respaldo del webhook: al volver de Wompi (?id=<transacción>) o si sigue pendiente, se consulta la transacción
  const txId = typeof sp.id === "string" ? sp.id : order.wompiTransactionId;
  if (order.status === "pendiente_pago" && txId) {
    const tx = await fetchTransaction(txId);
    if (tx && tx.reference === order.code) {
      await applyTransaction(tx);
      order = (await getOrder(codigo))!;
    }
  }

  const status = order.status as keyof typeof statusCopy;
  const copy = statusCopy[status] ?? statusCopy.pendiente_pago;
  const paid = ["pagado", "por_confirmar", "contraentrega", "despachado", "entregado"].includes(status);
  const local = order.shippingZone !== "nacional";
  const pickup = order.shippingZone === "recoger";
  const cod = order.paymentType === "contraentrega";
  // Texto según la entrega: local con fecha y franja; nacional como estaba
  const localText =
    local && (status === "pagado" || status === "contraentrega") && order.scheduledFor
      ? pickup
        ? `Estará listo para recoger ${describeDay(order.scheduledFor)}. Te escribimos por WhatsApp para coordinar.`
        : `Te lo llevamos ${describeDay(order.scheduledFor)}, según nuestra ruta. Ese día te avisamos el tiempo estimado.`
      : local && status === "despachado"
        ? pickup
          ? `Listo para recoger: ${order.deliveryWindow ?? "hoy"}. Escríbenos antes de venir.`
          : `Va en camino con nuestro domiciliario: llega ${order.deliveryWindow ?? "hoy"}.`
        : !local && (status === "pagado" || status === "despachado")
          ? "El envío es flete al cobro: lo pagas a la transportadora al recibir."
          : null;

  return (
    <div className="mx-auto max-w-3xl px-4 pt-8 pb-20 sm:px-6 lg:px-8 lg:pt-12">
      {paid && <ClearCart />}
      <p className="eyebrow text-carbon-suave">Pedido {order.code}</p>
      <h1 className="mt-2 font-hand text-[2.5rem] leading-none text-balance sm:text-5xl">{copy.title}</h1>
      <p className={`toon mt-6 rounded-2xl px-4 py-3 font-semibold ${copy.tint}`}>
        {status === "despachado" && local ? (pickup ? "Tu pedido está listo." : "Tu pedido salió de nuestro taller.") : copy.text}
        {localText && <span className="mt-1 block font-normal">{localText}</span>}
        {cod && ["por_confirmar", "contraentrega", "despachado"].includes(status) && (
          <span className="mt-1 block">Total a pagar al recibir: {formatCOP(order.total)}</span>
        )}
      </p>

      {status === "despachado" && !local && order.trackingNumber && (
        <section className="toon toon-shadow mt-6 grid gap-1 rounded-[1.75rem] bg-crema-claro p-5 sm:p-6">
          <h2 className="font-display text-xl font-extrabold">Seguimiento</h2>
          <p>
            Transportadora: <strong>{order.carrier}</strong>
          </p>
          <p>
            Número de guía: <strong className="select-all">{order.trackingNumber}</strong>
          </p>
          {order.shippingNote && <p className="mt-2 text-sm text-carbon-suave">{order.shippingNote}</p>}
          {order.trackingUrl && (
            <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="toon toon-press mt-3 justify-self-start rounded-full bg-estrella px-5 py-2.5 text-sm font-bold">
              Rastrear mi envío
            </a>
          )}
        </section>
      )}

      <section className="toon mt-8 grid gap-4 rounded-[1.75rem] bg-crema-claro p-5 sm:p-6">
        <h2 className="font-display text-xl font-extrabold">Resumen</h2>
        <ul className="grid gap-2 text-sm">
          {order.items.map((i) => (
            <li key={i.id} className="flex justify-between gap-3">
              <span className="min-w-0">
                <span className="font-semibold">{i.productName}</span>
                {i.optionName && <span className="text-carbon-suave"> · {i.optionName}</span>}
                <span className="text-carbon-suave"> × {i.quantity}</span>
                {i.note && <span className="block text-xs text-carbon-suave italic">“{i.note}”</span>}
              </span>
              <span className="shrink-0 font-bold tabular-nums">{formatCOP(i.unitPrice * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <dl className="grid gap-2 border-t-2 border-carbon/10 pt-3 text-sm">
          <div className="flex justify-between">
            <dt>Envío</dt>
            <dd className="font-bold tabular-nums">{!local ? "Al cobro" : pickup ? "Recoges" : formatCOP(order.shipping)}</dd>
          </div>
          <div className="flex justify-between text-base">
            <dt className="font-bold">Total</dt>
            <dd className="font-display text-xl font-extrabold tabular-nums">{formatCOP(order.total)}</dd>
          </div>
        </dl>
        <div className="border-t-2 border-carbon/10 pt-3 text-sm">
          <p className="font-bold">{pickup ? "Recoge" : "Envío a"}</p>
          <p>
            {order.name} · {order.phone}
            <br />
            {order.address}
            {order.addressNotes && ` (${order.addressNotes})`}
            <br />
            {order.city}, {order.department}
          </p>
        </div>
      </section>

      <div className="mt-8 flex flex-wrap gap-3">
        {status === "rechazado" || status === "pendiente_pago" ? (
          <Link href="/carrito" className="toon toon-press rounded-full bg-estrella px-6 py-3 text-sm font-bold">
            Volver al carrito
          </Link>
        ) : (
          <Link href="/tienda" className="toon toon-press rounded-full bg-estrella px-6 py-3 text-sm font-bold">
            Seguir comprando
          </Link>
        )}
        <a
          href={whatsappUrl(`¡Hola Lusarte! Tengo una pregunta sobre mi pedido ${order.code}.`)}
          target="_blank"
          rel="noopener noreferrer"
          className="toon toon-press inline-flex items-center gap-2 rounded-full bg-crema px-6 py-3 text-sm font-bold"
        >
          <WhatsAppIcon className="size-5" /> Escríbenos
        </a>
      </div>
      <p className="mt-6 text-xs text-carbon-suave">Guarda este enlace para consultar el estado de tu pedido.</p>
    </div>
  );
}
