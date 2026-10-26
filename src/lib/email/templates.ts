import { formatCOP } from "@/lib/format";
import type { OrderWithItems } from "@/lib/shop/orders";
import { formatDay, describeDelivery } from "@/lib/shop/calendar";
import { site } from "@/lib/site";
import { box, button, esc, h2, layout, p, rows, siteUrl, textFooter } from "./layout";

// Los cuatro correos del pedido (docs/PLAN.md §5). Cada uno devuelve asunto, HTML y texto plano.

export type EmailKind = "recibido" | "confirmacion" | "venta" | "despacho" | "pago_fallido";
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

/** Envío: valor del domicilio, "Recoges" o "Al cobro" (nacional) */
const shippingLabel = (o: OrderWithItems) =>
  o.shippingZone === "nacional" ? "Al cobro" : o.shippingZone === "recoger" ? "Recoges" : formatCOP(o.shipping);

function itemsHtml(o: OrderWithItems) {
  return rows([
    ...o.items.map((i) => ({
      label: `${esc(lineName(i))} <span class="mu" style="color:#5b5c5b;">× ${i.quantity}</span>`,
      sub: i.note ? `Personalización: ${esc(i.note)}` : undefined,
      value: formatCOP(i.unitPrice * i.quantity),
    })),
    { label: "Envío", value: shippingLabel(o) },
    { label: "Total", value: formatCOP(o.total), strong: true },
  ]);
}

function itemsText(o: OrderWithItems) {
  return [
    ...o.items.map((i) => `- ${lineName(i)} × ${i.quantity}: ${formatCOP(i.unitPrice * i.quantity)}${i.note ? `\n  Personalización: ${i.note}` : ""}`),
    `Envío: ${shippingLabel(o)}`,
    `Total: ${formatCOP(o.total)}`,
  ].join("\n");
}

const isCod = (o: OrderWithItems) => o.paymentType === "contraentrega";
const isLocal = (o: OrderWithItems) => o.shippingZone !== "nacional";
const isPickup = (o: OrderWithItems) => o.shippingZone === "recoger";
const FLETE = "El envío nacional es al cobro: lo pagas a la transportadora al recibir.";
/** "el lunes 20 de octubre" para la entrega local programada */
const deliveryDay = (o: OrderWithItems) => (o.scheduledFor ? `el ${formatDay(o.scheduledFor)}` : "pronto");
/** Cómo y cuándo llega, en una frase. */
function deliveryLine(o: OrderWithItems) {
  if (isPickup(o)) return `Estará listo para recoger ${deliveryDay(o)}. Te escribimos por WhatsApp para coordinar el lugar y la hora.`;
  if (isLocal(o)) return `Te lo llevamos ${deliveryDay(o)} a tu dirección, según nuestra ruta. Ese día te avisamos el tiempo estimado.`;
  return `Despachamos en 1 a 3 días hábiles. Cuando salga, te escribimos con la transportadora y el número de guía. ${FLETE}`;
}

const addressLines = (o: OrderWithItems) => [
  o.name,
  o.phone,
  `${o.address}${o.addressNotes ? ` (${o.addressNotes})` : ""}`,
  `${o.neighborhood ? `Barrio ${o.neighborhood}, ` : ""}${o.city}, ${o.department}`,
];
const addressHtml = (o: OrderWithItems) => addressLines(o).map(esc).join("<br>");

/** 1. Confirmación de compra (cliente) */
export function confirmationEmail(o: OrderWithItems): Rendered {
  const cod = isCod(o);
  const title = cod ? `¡Recibimos tu pedido, ${firstName(o.name)}!` : `¡Gracias por tu compra, ${firstName(o.name)}!`;
  const intro = cod
    ? `Tu pedido <strong>${esc(o.code)}</strong> quedó confirmado y ya lo estamos preparando con mucho cariño.`
    : `Recibimos el pago de tu pedido <strong>${esc(o.code)}</strong> y ya lo estamos preparando con mucho cariño.`;
  const html = layout({
    preheader: cod
      ? `Pedido ${o.code} confirmado. Pagas ${formatCOP(o.total)} al recibirlo ${deliveryDay(o)}.`
      : isLocal(o)
        ? `Recibimos el pago de tu pedido ${o.code}. Te lo llevamos ${deliveryDay(o)}.`
        : `Recibimos el pago de tu pedido ${o.code}. Te avisamos cuando lo despachemos.`,
    title,
    reason: REASON_CLIENT,
    body: [
      p(intro),
      cod
        ? box(
            `<strong>Pagas ${formatCOP(o.total)} al ${isPickup(o) ? "recoger" : "recibir"}</strong>, en efectivo o por transferencia.<br>${esc(deliveryLine(o))}`,
          )
        : p(esc(deliveryLine(o))),
      h2("Tu pedido"),
      itemsHtml(o),
      isPickup(o) ? "" : h2(isLocal(o) ? "Te lo llevamos a" : "Lo enviamos a"),
      isPickup(o) ? "" : box(addressHtml(o)),
      p("Te adjuntamos el comprobante de tu compra en PDF.", true),
      button(orderLink(o), "Ver mi pedido"),
      p(`¿Algo no está bien? Responde este correo o escríbenos por <a href="https://wa.me/${site.whatsapp}" target="_blank">WhatsApp</a>.`, true),
    ].join(""),
  });
  const text = `${title}\n\n${cod ? `Tu pedido ${o.code} quedó confirmado.\nPagas ${formatCOP(o.total)} al recibir, en efectivo o por transferencia. Te lo llevamos ${deliveryDay(o)}.` : `Recibimos el pago de tu pedido ${o.code} y ya lo estamos preparando.\n${deliveryLine(o)}`}\n\nTu pedido:\n${itemsText(o)}\n\n${isLocal(o) ? "Te lo llevamos a" : "Lo enviamos a"}:\n${addressLines(o).join("\n")}\n\nVer mi pedido: ${orderLink(o)}${textFooter(REASON_CLIENT)}`;
  return { subject: cod ? `Pedido ${o.code} confirmado: pagas al recibir` : `Recibimos tu pedido ${o.code}`, html, text };
}

/** 2. Nueva venta (Lusarte) */
export function newSaleEmail(o: OrderWithItems): Rendered {
  const panel = siteUrl(`/admin/pedidos/${o.code}`);
  const title = `Nueva venta: ${o.code}`;
  const reason = "Aviso interno de la tienda de lusarte.net.";
  const html = layout({
    preheader: isCod(o)
      ? `${o.name} pidió ${formatCOP(o.total)} contraentrega. Entrega ${deliveryDay(o)}.`
      : `${o.name} pagó ${formatCOP(o.total)}. ${isLocal(o) ? `Entrega local ${deliveryDay(o)}.` : "Listo para despachar."}`,
    title,
    reason,
    body: [
      o.status === "por_confirmar"
        ? box(`<strong>CONTRAENTREGA POR CONFIRMAR.</strong> Escríbele al cliente (${esc(o.phone)}) y confírmalo en el panel: ahí se aparta el inventario, se crea la remisión en Effi y se programa la entrega. Cobrar ${formatCOP(o.total)} al entregar.`)
        : isCod(o)
        ? box(`<strong>CONTRAENTREGA:</strong> cobrar ${formatCOP(o.total)} al entregar (efectivo o transferencia).`)
        : p(`<strong>${esc(o.name)}</strong> pagó <strong>${formatCOP(o.total)}</strong>${o.paymentMethod ? ` con ${esc(paymentMethod(o.paymentMethod))}` : ""}.`),
      p(
        isPickup(o)
          ? `<strong>Para recoger</strong>${o.scheduledFor ? ` ${esc(deliveryDay(o))}` : ""}: coordinar por WhatsApp.`
          : isLocal(o)
            ? `<strong>Domicilio Lusarte</strong>${o.deliveryZone ? ` · zona ${esc(o.deliveryZone)}` : ""}${o.scheduledFor ? ` ${esc(deliveryDay(o))}` : ""}.`
            : "<strong>Envío nacional</strong> por transportadora, flete al cobro.",
      ),
      o.stockAlert ? box("<strong>Revisar inventario:</strong> se vendió más de lo que había en stock (dos pagos casi al tiempo).") : "",
      h2("Productos"),
      itemsHtml(o),
      h2("Cliente y envío"),
      box(`${addressHtml(o)}<br>${esc(o.email)}${o.legalId ? `<br>Documento ${esc(o.legalId)}` : ""}`),
      o.status === "por_confirmar"
        ? ""
        : o.effiRemisionId
        ? p(`<strong>Remisión de venta en Effi: N.º ${o.effiRemisionId}</strong>. El inventario ya se descontó. Adjuntamos el comprobante en PDF.`)
        : box(`<strong>No se creó la remisión en Effi.</strong> ${esc(o.effiRemisionError ?? "")}<br>Créala desde el panel (botón "Crear remisión") o a mano en Effi.`),
      p(`Referencia de Wompi: ${esc(o.wompiTransactionId ?? "—")}`, true),
      button(panel, "Despachar en el panel"),
    ].join(""),
  });
  const text = `${title}\n\n${isCod(o) ? `CONTRAENTREGA: cobrar ${formatCOP(o.total)} al entregar.` : `${o.name} pagó ${formatCOP(o.total)}.`}\n${isLocal(o) ? `Entrega local ${deliveryDay(o)}.` : "Envío nacional."}${o.stockAlert ? "\nREVISAR INVENTARIO: se vendió más de lo que había en stock." : ""}\n\nProductos:\n${itemsText(o)}\n\nCliente y envío:\n${addressLines(o).join("\n")}\n${o.email}${o.legalId ? `\nDocumento ${o.legalId}` : ""}\n\n${o.effiRemisionId ? `Remisión de venta en Effi: N.º ${o.effiRemisionId}` : `NO SE CREÓ LA REMISIÓN EN EFFI: ${o.effiRemisionError ?? ""}`}\nWompi: ${o.wompiTransactionId ?? "—"}\nDespachar: ${panel}${textFooter(reason)}`;
  const tag = o.status === "por_confirmar" ? " · contraentrega por confirmar" : isCod(o) ? " · contraentrega" : isPickup(o) ? " · recoger" : isLocal(o) ? " · local" : "";
  return { subject: `Nueva venta ${o.code} · ${formatCOP(o.total)}${tag}`, html, text };
}

/** 3. Tu pedido va en camino (cliente) */
export function shippedEmail(o: OrderWithItems): Rendered {
  if (isLocal(o)) return localShippedEmail(o);
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
      p(`<strong>Flete al cobro:</strong> el valor del envío lo pagas a la transportadora al recibir.`),
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

/** 3b. Entrega local: sale con nuestro domiciliario en la franja elegida */
function localShippedEmail(o: OrderWithItems): Rendered {
  if (isPickup(o)) return pickupReadyEmail(o);
  const cod = isCod(o);
  const title = "Tu pedido va en camino";
  const when = describeDelivery(o.deliveryWindow, o.shippedAt);
  const html = layout({
    preheader: `Tu pedido ${o.code} llega ${when}.${cod ? ` Ten listos ${formatCOP(o.total)}.` : ""}`,
    title,
    reason: REASON_CLIENT,
    body: [
      p(`Hola, ${esc(firstName(o.name))}. Tu pedido <strong>${esc(o.code)}</strong> ya va en camino con nuestro domiciliario.`),
      box(`<strong>Llega: ${esc(when)}</strong><br>${addressHtml(o)}`),
      cod ? box(`<strong>Pagas ${formatCOP(o.total)} al recibir</strong>, en efectivo o por transferencia.`) : "",
      o.shippingNote ? p(`<strong>Nota de Lusarte:</strong> ${esc(o.shippingNote)}`) : "",
      p("Si no vas a estar, escríbenos por WhatsApp para reprogramar la entrega."),
      button(`https://wa.me/${site.whatsapp}?text=${encodeURIComponent(`Hola Lusarte, sobre la entrega de mi pedido ${o.code}`)}`, "Escribir por WhatsApp"),
      h2("Tu pedido"),
      itemsHtml(o),
    ].join(""),
  });
  const text = `${title}\n\nHola, ${firstName(o.name)}. Tu pedido ${o.code} va en camino con nuestro domiciliario.\nLlega: ${when}\n${addressLines(o).join("\n")}${cod ? `\n\nPagas ${formatCOP(o.total)} al recibir, en efectivo o por transferencia.` : ""}${o.shippingNote ? `\n\nNota de Lusarte: ${o.shippingNote}` : ""}\n\nSi no vas a estar, escríbenos por WhatsApp: https://wa.me/${site.whatsapp}\n\nTu pedido:\n${itemsText(o)}${textFooter(REASON_CLIENT)}`;
  return { subject: `Tu pedido ${o.code} llega ${when}`, html, text };
}

/** 3c. Recoger: el pedido está listo en el punto de entrega */
function pickupReadyEmail(o: OrderWithItems): Rendered {
  const cod = isCod(o);
  const title = "Tu pedido está listo para recoger";
  const when = describeDelivery(o.deliveryWindow, o.shippedAt);
  const wa = `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(`Hola Lusarte, voy a recoger mi pedido ${o.code}`)}`;
  const html = layout({
    preheader: `Tu pedido ${o.code} ya está listo: ${when}.`,
    title,
    reason: REASON_CLIENT,
    body: [
      p(`Hola, ${esc(firstName(o.name))}. Tu pedido <strong>${esc(o.code)}</strong> ya está listo en nuestro punto de entrega.`),
      box(`<strong>Cuándo: ${esc(when)}</strong>${o.shippingNote ? `<br>${esc(o.shippingNote)}` : ""}`),
      cod ? box(`<strong>Pagas ${formatCOP(o.total)} al recoger</strong>, en efectivo o por transferencia.`) : "",
      p("Escríbenos por WhatsApp antes de venir para confirmar el lugar y la hora."),
      button(wa, "Coordinar por WhatsApp"),
      h2("Tu pedido"),
      itemsHtml(o),
    ].join(""),
  });
  const text = `${title}\n\nHola, ${firstName(o.name)}. Tu pedido ${o.code} ya está listo en nuestro punto de entrega.\nCuándo: ${when}${o.shippingNote ? `\n${o.shippingNote}` : ""}${cod ? `\n\nPagas ${formatCOP(o.total)} al recoger, en efectivo o por transferencia.` : ""}\n\nEscríbenos por WhatsApp antes de venir: ${wa}\n\nTu pedido:\n${itemsText(o)}${textFooter(REASON_CLIENT)}`;
  return { subject: `Tu pedido ${o.code} está listo para recoger`, html, text };
}

/** 0. Contraentrega recibida, por confirmar (cliente) */
export function receivedEmail(o: OrderWithItems): Rendered {
  const title = `¡Recibimos tu pedido, ${firstName(o.name)}!`;
  const html = layout({
    preheader: `Pedido ${o.code}: te escribimos para confirmarlo y coordinar la entrega.`,
    title,
    reason: REASON_CLIENT,
    body: [
      p(`Recibimos tu pedido <strong>${esc(o.code)}</strong> con pago contraentrega.`),
      box(`<strong>Te escribimos por WhatsApp</strong> al ${esc(o.phone)} para confirmarlo y coordinar ${isPickup(o) ? "dónde recogerlo" : "la entrega"}. Los pedidos están sujetos a disponibilidad.`),
      p(`Cuando lo confirmemos te llega otro correo. Pagas ${formatCOP(o.total)} al ${isPickup(o) ? "recoger" : "recibir"}, en efectivo o por transferencia.`),
      h2("Tu pedido"),
      itemsHtml(o),
      button(orderLink(o), "Ver mi pedido"),
    ].join(""),
  });
  const text = `${title}\n\nRecibimos tu pedido ${o.code} con pago contraentrega.\nTe escribimos por WhatsApp al ${o.phone} para confirmarlo y coordinar la entrega. Los pedidos están sujetos a disponibilidad.\nPagas ${formatCOP(o.total)} al recibir, en efectivo o por transferencia.\n\nTu pedido:\n${itemsText(o)}\n\nVer mi pedido: ${orderLink(o)}${textFooter(REASON_CLIENT)}`;
  return { subject: `Recibimos tu pedido ${o.code}: te escribimos para confirmarlo`, html, text };
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
  recibido: "Pedido recibido (por confirmar)",
  confirmacion: "Confirmación al cliente",
  venta: "Aviso de venta a Lusarte",
  despacho: "Envío con la guía",
  pago_fallido: "Pago no completado",
};
