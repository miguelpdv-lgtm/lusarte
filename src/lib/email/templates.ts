import { formatCOP } from "@/lib/format";
import type { OrderWithItems } from "@/lib/shop/orders";
import { site } from "@/lib/site";
import { box, button, esc, h2, layout, p, rows, siteUrl, textFooter } from "./layout";

// Los cuatro correos del pedido (docs/PLAN.md §5). Cada uno devuelve asunto, HTML y texto plano.

export type EmailKind = "confirmacion" | "venta" | "despacho" | "pago_fallido";
export type Rendered = { subject: string; html: string; text: string };

const REASON_CLIENT = "Recibes este correo porque hiciste un pedido en lusarte.net.";
const PAYMENT_METHODS: Record<string, string> = {
  CARD: "tarjeta",
  PSE: "PSE",
  NEQUI: "Nequi",
  BANCOLOMBIA_TRANSFER: "Bancolombia",
  BANCOLOMBIA_QR: "QR Bancolombia",
  DAVIPLATA: "Daviplata",
};
export const paymentMethod = (m: string) => PAYMENT_METHODS[m] ?? m.toLowerCase().replace(/_/g, " ");
const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? name;
const orderLink = (o: OrderWithItems) => siteUrl(`/pedido/${o.code}?t=${o.token}`);
const lineName = (i: OrderWithItems["items"][number]) => `${i.productName}${i.optionName ? ` · ${i.optionName}` : ""}`;

function itemsHtml(o: OrderWithItems) {
  return rows([
    ...o.items.map((i) => ({
      label: `${esc(lineName(i))} <span class="mu" style="color:#5b5c5b;">× ${i.quantity}</span>`,
      sub: i.note ? `Personalización: ${esc(i.note)}` : undefined,
      value: formatCOP(i.unitPrice * i.quantity),
    })),
    { label: "Envío", value: formatCOP(o.shipping) },
    { label: "Total", value: formatCOP(o.total), strong: true },
  ]);
}

function itemsText(o: OrderWithItems) {
  return [
    ...o.items.map((i) => `- ${lineName(i)} × ${i.quantity}: ${formatCOP(i.unitPrice * i.quantity)}${i.note ? `\n  Personalización: ${i.note}` : ""}`),
    `Envío: ${formatCOP(o.shipping)}`,
    `Total: ${formatCOP(o.total)}`,
  ].join("\n");
}

const addressLines = (o: OrderWithItems) => [o.name, o.phone, `${o.address}${o.addressNotes ? ` (${o.addressNotes})` : ""}`, `${o.city}, ${o.department}`];
const addressHtml = (o: OrderWithItems) => addressLines(o).map(esc).join("<br>");

/** 1. Confirmación de compra (cliente) */
export function confirmationEmail(o: OrderWithItems): Rendered {
  const title = `¡Gracias por tu compra, ${firstName(o.name)}!`;
  const html = layout({
    preheader: `Recibimos el pago de tu pedido ${o.code}. Te avisamos cuando lo despachemos.`,
    title,
    reason: REASON_CLIENT,
    body: [
      p(`Recibimos el pago de tu pedido <strong>${esc(o.code)}</strong> y ya lo estamos preparando con mucho cariño.`),
      p("Despachamos en 1 a 3 días hábiles. Cuando salga, te escribimos con la transportadora y el número de guía."),
      h2("Tu pedido"),
      itemsHtml(o),
      h2("Lo enviamos a"),
      box(addressHtml(o)),
      p("Te adjuntamos el comprobante de tu compra en PDF.", true),
      button(orderLink(o), "Ver mi pedido"),
      p(`¿Algo no está bien? Responde este correo o escríbenos por <a href="https://wa.me/${site.whatsapp}" target="_blank">WhatsApp</a>.`, true),
    ].join(""),
  });
  const text = `${title}\n\nRecibimos el pago de tu pedido ${o.code} y ya lo estamos preparando.\nDespachamos en 1 a 3 días hábiles. Cuando salga, te escribimos con la transportadora y el número de guía.\n\nTu pedido:\n${itemsText(o)}\n\nLo enviamos a:\n${addressLines(o).join("\n")}\n\nVer mi pedido: ${orderLink(o)}${textFooter(REASON_CLIENT)}`;
  return { subject: `Recibimos tu pedido ${o.code}`, html, text };
}

/** 2. Nueva venta (Lusarte) */
export function newSaleEmail(o: OrderWithItems): Rendered {
  const panel = siteUrl(`/admin/pedidos/${o.code}`);
  const title = `Nueva venta: ${o.code}`;
  const reason = "Aviso interno de la tienda de lusarte.net.";
  const html = layout({
    preheader: `${o.name} pagó ${formatCOP(o.total)}. Pedido listo para despachar.`,
    title,
    reason,
    body: [
      p(`<strong>${esc(o.name)}</strong> pagó <strong>${formatCOP(o.total)}</strong>${o.paymentMethod ? ` con ${esc(paymentMethod(o.paymentMethod))}` : ""}.`),
      o.stockAlert ? box("<strong>Revisar inventario:</strong> se vendió más de lo que había en stock (dos pagos casi al tiempo).") : "",
      h2("Productos"),
      itemsHtml(o),
      h2("Cliente y envío"),
      box(`${addressHtml(o)}<br>${esc(o.email)}${o.legalId ? `<br>Documento ${esc(o.legalId)}` : ""}`),
      o.effiRemisionId
        ? p(`<strong>Remisión de venta en Effi: N.º ${o.effiRemisionId}</strong>. El inventario ya se descontó. Adjuntamos el comprobante en PDF.`)
        : box(`<strong>No se creó la remisión en Effi.</strong> ${esc(o.effiRemisionError ?? "")}<br>Créala desde el panel (botón "Crear remisión") o a mano en Effi.`),
      p(`Referencia de Wompi: ${esc(o.wompiTransactionId ?? "—")}`, true),
      button(panel, "Despachar en el panel"),
    ].join(""),
  });
  const text = `${title}\n\n${o.name} pagó ${formatCOP(o.total)}.${o.stockAlert ? "\nREVISAR INVENTARIO: se vendió más de lo que había en stock." : ""}\n\nProductos:\n${itemsText(o)}\n\nCliente y envío:\n${addressLines(o).join("\n")}\n${o.email}${o.legalId ? `\nDocumento ${o.legalId}` : ""}\n\n${o.effiRemisionId ? `Remisión de venta en Effi: N.º ${o.effiRemisionId}` : `NO SE CREÓ LA REMISIÓN EN EFFI: ${o.effiRemisionError ?? ""}`}\nWompi: ${o.wompiTransactionId ?? "—"}\nDespachar: ${panel}${textFooter(reason)}`;
  return { subject: `Nueva venta ${o.code} · ${formatCOP(o.total)}`, html, text };
}

/** 3. Tu pedido va en camino (cliente) */
export function shippedEmail(o: OrderWithItems): Rendered {
  const title = `Tu pedido va en camino`;
  const tracking = [
    `Transportadora: <strong>${esc(o.carrier)}</strong>`,
    `Número de guía: <strong>${esc(o.trackingNumber)}</strong>`,
  ].join("<br>");
  const html = layout({
    preheader: `Despachamos tu pedido ${o.code} con ${o.carrier ?? "la transportadora"}. Guía ${o.trackingNumber ?? ""}.`,
    title,
    reason: REASON_CLIENT,
    body: [
      p(`Hola, ${esc(firstName(o.name))}. Tu pedido <strong>${esc(o.code)}</strong> ya salió de nuestro taller.`),
      box(tracking),
      o.trackingUrl ? button(o.trackingUrl, "Rastrear mi envío") : p("Puedes rastrearlo en la página de la transportadora con el número de guía.", true),
      o.shippingNote ? p(`<strong>Nota de Lusarte:</strong> ${esc(o.shippingNote)}`) : "",
      h2("Lo enviamos a"),
      box(addressHtml(o)),
      h2("Tu pedido"),
      itemsHtml(o),
      p(`Puedes ver el estado en <a href="${esc(orderLink(o))}" target="_blank">tu página del pedido</a>. ¿Dudas? Responde este correo o escríbenos por <a href="https://wa.me/${site.whatsapp}" target="_blank">WhatsApp</a>.`, true),
    ].join(""),
  });
  const text = `${title}\n\nHola, ${firstName(o.name)}. Tu pedido ${o.code} ya salió de nuestro taller.\n\nTransportadora: ${o.carrier}\nNúmero de guía: ${o.trackingNumber}${o.trackingUrl ? `\nRastreo: ${o.trackingUrl}` : ""}${o.shippingNote ? `\n\nNota de Lusarte: ${o.shippingNote}` : ""}\n\nLo enviamos a:\n${addressLines(o).join("\n")}\n\nTu pedido:\n${itemsText(o)}\n\nEstado del pedido: ${orderLink(o)}${textFooter(REASON_CLIENT)}`;
  return { subject: `Tu pedido ${o.code} va en camino`, html, text };
}

/** 4. Pago no completado (cliente) */
export function paymentFailedEmail(o: OrderWithItems): Rendered {
  const title = "Tu pago no se completó";
  const html = layout({
    preheader: `El pago del pedido ${o.code} no fue aprobado. No se hizo ningún cobro.`,
    title,
    reason: REASON_CLIENT,
    body: [
      p(`Hola, ${esc(firstName(o.name))}. El pago de tu pedido <strong>${esc(o.code)}</strong> no fue aprobado, así que no se hizo ningún cobro.`),
      p("Suele pasar por fondos insuficientes, un dato mal escrito o una validación del banco. Tus productos siguen en el carrito para que lo intentes de nuevo."),
      button(siteUrl("/carrito"), "Volver a intentarlo"),
      p(`Si prefieres, te ayudamos por <a href="https://wa.me/${site.whatsapp}" target="_blank">WhatsApp</a> a terminar tu compra.`, true),
    ].join(""),
  });
  const text = `${title}\n\nHola, ${firstName(o.name)}. El pago de tu pedido ${o.code} no fue aprobado, así que no se hizo ningún cobro.\nTus productos siguen en el carrito para que lo intentes de nuevo: ${siteUrl("/carrito")}\n\nTambién te ayudamos por WhatsApp: https://wa.me/${site.whatsapp}${textFooter(REASON_CLIENT)}`;
  return { subject: `Tu pago del pedido ${o.code} no se completó`, html, text };
}

export const EMAIL_LABELS: Record<EmailKind, string> = {
  confirmacion: "Confirmación al cliente",
  venta: "Aviso de venta a Lusarte",
  despacho: "Envío con la guía",
  pago_fallido: "Pago no completado",
};
