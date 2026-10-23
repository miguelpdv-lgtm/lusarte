import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import fontkit from "@pdf-lib/fontkit";
import { inArray } from "drizzle-orm";
import { PDFDocument, rgb, type PDFFont, type PDFImage, type PDFPage } from "pdf-lib";
import QRCode from "qrcode";
import { db, schema } from "@/lib/db";
import { formatCOP } from "@/lib/format";
import type { OrderWithItems } from "@/lib/shop/orders";
import { business } from "@/lib/legal";
import { site } from "@/lib/site";
import { formatDay } from "@/lib/shop/calendar";
import { siteUrl } from "./layout";
import { paymentMethod } from "./templates";

// Comprobante de venta en PDF (la API de Effi no entrega el PDF de la remisión). Tiene todo lo del documento
// de Effi (datos legales, cliente, referencias, descuentos, impuestos, forma de pago, observación, recibido)
// más la marca, el pago en línea, la entrega y un QR al estado del pedido.
// Los datos legales del negocio vienen de variables de entorno (el repo es público): BUSINESS_*.

const hex = (h: string) => rgb(parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255);
const C = {
  carbon: hex("#383939"),
  suave: hex("#5b5c5b"),
  crema: hex("#efebe0"),
  cremaClaro: hex("#f7f4ec"),
  lavanda: hex("#dcc5e0"),
  estrella: hex("#f5eca0"),
  linea: hex("#d9d3c3"),
  blanco: hex("#ffffff"),
};

const W = 595.28;
const H = 841.89;
const M = 36;


/** Quita emojis y caracteres de control que las fuentes no tienen. */
const clean = (s: string) => s.replace(/\p{Extended_Pictographic}|️|‍/gu, "").replace(/[\u0000-\u001f]/g, " ");

const dateFmt = new Intl.DateTimeFormat("es-CO", { dateStyle: "long", timeStyle: "short", timeZone: "America/Bogota" });

type Fonts = { regular: PDFFont; bold: PDFFont; display: PDFFont; hand: PDFFont };

let fontCache: Record<string, Uint8Array> | null = null;
async function fontFiles() {
  if (fontCache) return fontCache;
  const dir = path.join(process.cwd(), "src", "assets", "fonts");
  const [regular, bold, display, hand] = await Promise.all(
    ["DMSans-Regular.ttf", "DMSans-Bold.ttf", "BricolageGrotesque-ExtraBold.ttf", "PatrickHand-Regular.ttf"].map((f) => readFile(path.join(dir, f))),
  );
  fontCache = { regular, bold, display, hand };
  return fontCache;
}

/** Referencias de Effi de los artículos del pedido (columna "Ref."). */
async function references(o: OrderWithItems) {
  const ids = [...new Set(o.items.map((i) => i.effiArticleId))];
  if (!ids.length) return new Map<number, string>();
  const rows = await db.select({ id: schema.effiArticles.id, ref: schema.effiArticles.referencia }).from(schema.effiArticles).where(inArray(schema.effiArticles.id, ids));
  return new Map(rows.map((r) => [r.id, r.ref ?? ""]));
}

export async function receiptPdf(o: OrderWithItems): Promise<Buffer> {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const files = await fontFiles();
  const f: Fonts = {
    regular: await pdf.embedFont(files.regular, { subset: true }),
    bold: await pdf.embedFont(files.bold, { subset: true }),
    display: await pdf.embedFont(files.display, { subset: true }),
    hand: await pdf.embedFont(files.hand, { subset: true }),
  };
  const biz = business();
  const refs = await references(o);
  const title = o.effiRemisionId ? `Remisión N.º ${o.effiRemisionId}` : `Pedido ${o.code}`;
  pdf.setTitle(`Lusarte · ${title}`);
  pdf.setAuthor(site.name);
  pdf.setSubject(`Comprobante de venta del pedido ${o.code}`);

  let logo: PDFImage | null = null;
  try {
    logo = await pdf.embedPng(await readFile(path.join(process.cwd(), "public", "email", "logo-stacked.png")));
  } catch {
    // sin logo: se escribe el nombre
  }
  const qr = await pdf.embedPng(
    await QRCode.toBuffer(siteUrl(`/pedido/${o.code}?t=${o.token}`), { type: "png", margin: 0, width: 300, color: { dark: "#383939ff", light: "#00000000" } }),
  );

  let page: PDFPage = pdf.addPage([W, H]);

  // ─── Utilidades de dibujo (y es la línea base, desde abajo) ───
  const text = (s: string, x: number, y: number, size: number, font: PDFFont = f.regular, color = C.carbon) =>
    page.drawText(clean(s), { x, y, size, font, color });
  const textRight = (s: string, xr: number, y: number, size: number, font: PDFFont = f.regular, color = C.carbon) =>
    text(s, xr - font.widthOfTextAtSize(clean(s), size), y, size, font, color);
  const textCenter = (s: string, xc: number, y: number, size: number, font: PDFFont = f.regular, color = C.carbon) =>
    text(s, xc - font.widthOfTextAtSize(clean(s), size) / 2, y, size, font, color);
  /** Rectángulo redondeado: (x, top) es la esquina superior izquierda */
  const card = (x: number, top: number, w: number, h: number, opts: { fill?: ReturnType<typeof rgb>; border?: boolean; r?: number } = {}) => {
    const r = opts.r ?? 10;
    page.drawSvgPath(`M ${r} 0 H ${w - r} Q ${w} 0 ${w} ${r} V ${h - r} Q ${w} ${h} ${w - r} ${h} H ${r} Q 0 ${h} 0 ${h - r} V ${r} Q 0 0 ${r} 0 Z`, {
      x,
      y: top,
      color: opts.fill,
      borderColor: opts.border === false ? undefined : C.carbon,
      borderWidth: opts.border === false ? 0 : 1.4,
    });
  };
  const wrap = (s: string, font: PDFFont, size: number, width: number) => {
    const lines: string[] = [];
    for (const para of clean(s).split("\n")) {
      let line = "";
      for (const word of para.split(/\s+/)) {
        const next = line ? `${line} ${word}` : word;
        if (line && font.widthOfTextAtSize(next, size) > width) {
          lines.push(line);
          line = word;
        } else line = next;
      }
      lines.push(line);
    }
    return lines;
  };

  // ─── Encabezado ───
  const headTop = H - M;
  const headH = 104;
  card(M, headTop, W - 2 * M, headH, { fill: C.cremaClaro });
  // Logo sobre un cuadro lavanda, como el de la marca
  const lx = M + 12;
  const sq = 80;
  card(lx, headTop - 12, sq, sq, { fill: C.lavanda, border: false, r: 12 });
  if (logo) {
    const lw = 64;
    const lh = (lw * logo.height) / logo.width;
    page.drawImage(logo, { x: lx + (sq - lw) / 2, y: headTop - 12 - sq / 2 - lh / 2, width: lw, height: lh });
  } else textCenter(site.name, lx + sq / 2, headTop - 56, 16, f.display);

  // Datos del negocio
  const bx = lx + sq + 16;
  let by = headTop - 28;
  text("LUSARTE", bx, by, 17, f.display);
  by -= 14;
  if (biz.legalName) {
    text(biz.legalName, bx, by, 8.5, f.bold);
    by -= 12;
  }
  const nitLine = [biz.nit && `NIT ${biz.nit}`, biz.regime].filter(Boolean).join(" · ");
  if (nitLine) {
    text(nitLine, bx, by, 8, f.regular, C.suave);
    by -= 11;
  }
  if (biz.address) {
    text(biz.address, bx, by, 8, f.regular, C.suave);
    by -= 11;
  }
  text(biz.email ? `Tel. ${site.phone} · ${biz.email}` : `Tel. ${site.phone} · WhatsApp`, bx, by, 8, f.regular, C.suave);
  by -= 11;
  text("lusarte.net · Instagram @" + site.instagram, bx, by, 8, f.regular, C.suave);

  // QR al estado del pedido
  const qrSize = 70;
  const qrX = W - M - 14 - qrSize;
  page.drawImage(qr, { x: qrX, y: headTop - 14 - qrSize, width: qrSize, height: qrSize });
  textCenter("Estado del pedido", qrX + qrSize / 2, headTop - 14 - qrSize - 11, 6.5, f.regular, C.suave);

  // Franja del documento: número a la izquierda; pedido, fecha y estado a la derecha
  const barTop = headTop - headH - 10;
  const barH = 40;
  card(M, barTop, W - 2 * M, barH, { fill: C.estrella });
  text("COMPROBANTE DE VENTA", M + 14, barTop - 15, 7, f.bold, C.suave);
  text(title, M + 14, barTop - 32, 15, f.display);
  const cod = o.paymentType === "contraentrega";
  const statusLabel =
    o.status === "entregado" ? "Entregado" : o.status === "despachado" ? "Despachado" : cod ? "Pago al recibir" : "Pagado";
  const sw = f.bold.widthOfTextAtSize(statusLabel, 7.5) + 18;
  const sx = W - M - 14 - sw;
  card(sx, barTop - 12, sw, 16, { fill: C.blanco, r: 8 });
  textCenter(statusLabel, sx + sw / 2, barTop - 23, 7.5, f.bold);
  const meta = `${o.effiRemisionId ? `Pedido web ${o.code} · ` : ""}${dateFmt.format(o.paidAt ?? o.createdAt)}`;
  textRight(meta, sx - 10, barTop - 23, 8.5, f.bold);

  // ─── Cliente y entrega ───
  let y = barTop - barH - 12;
  const colW = (W - 2 * M - 12) / 2;
  const docType = ({ 1: "NIT", 2: "CC", 3: "Pasaporte", 4: "CE" } as Record<number, string>)[o.legalIdType ?? 0] ?? "";
  const clientLines: [string, string][] = [
    ["Nombre", o.name],
    ["Documento", o.legalId ? `${docType} ${o.legalId}`.trim() : "—"],
    ["Celular", o.phone],
    ["Correo", o.email],
  ];
  const addr = [o.address, o.addressNotes].filter(Boolean).join(" · ");
  const deliveryLines: [string, string][] = [
    ["Dirección", addr || "—"],
    ...(o.neighborhood ? ([["Barrio", o.neighborhood]] as [string, string][]) : []),
    ["Ciudad", `${o.city}, ${o.department}`],
    ...(o.shippingZone !== "nacional"
      ? ([
          [
            "Entrega",
            `${o.shippingZone === "recoger" ? "Recoge en el punto de entrega" : "Domicilio Lusarte"}${o.scheduledFor ? ` · ${formatDay(o.scheduledFor)}` : ""}`,
          ],
          ...(o.deliveryWindow ? [["Franja", o.deliveryWindow]] : []),
        ] as [string, string][])
      : o.trackingNumber
        ? ([["Transportadora", `${o.carrier} · guía ${o.trackingNumber}`]] as [string, string][])
        : ([["Entrega", "Envío nacional por transportadora (flete al cobro)"]] as [string, string][])),
  ];
  const valueW = colW - 24 - 62;
  const rowsH = (lines: [string, string][]) => lines.reduce((h, [, v]) => h + wrap(v, f.regular, 8.5, valueW).length * 11 + 3, 0);
  const infoH = 28 + Math.max(rowsH(clientLines), rowsH(deliveryLines)) + 6;
  const infoCard = (x: number, heading: string, lines: [string, string][]) => {
    card(x, y, colW, infoH, { fill: C.blanco });
    text(heading, x + 12, y - 17, 10, f.display);
    let ly = y - 32;
    for (const [k, v] of lines) {
      text(k, x + 12, ly, 7.5, f.bold, C.suave);
      for (const l of wrap(v, f.regular, 8.5, valueW)) {
        text(l, x + 12 + 62, ly, 8.5);
        ly -= 11;
      }
      ly -= 3;
    }
  };
  infoCard(M, "Cliente", clientLines);
  infoCard(M + colW + 12, "Entrega", deliveryLines);
  y -= infoH + 16;

  // ─── Conceptos ───
  const cols = { item: M + 10, ref: M + 30, desc: M + 82, qty: W - M - 196, price: W - M - 128, disc: W - M - 72, total: W - M - 10 };
  const descW = cols.qty - 26 - cols.desc;
  const tableHeader = () => {
    card(M, y, W - 2 * M, 20, { fill: C.carbon, border: false, r: 6 });
    const hy = y - 13.5;
    for (const [s, x, al] of [
      ["#", cols.item, "l"],
      ["Ref.", cols.ref, "l"],
      ["Descripción", cols.desc, "l"],
      ["Cant.", cols.qty, "r"],
      ["Precio ud.", cols.price, "r"],
      ["Desc.", cols.disc, "r"],
      ["Total", cols.total, "r"],
    ] as const)
      (al === "l" ? text : textRight)(s, x, hy, 7.5, f.bold, C.crema);
    y -= 24;
  };
  const newPage = () => {
    page = pdf.addPage([W, H]);
    y = H - M;
    text(`${title} · continuación`, M, y - 10, 9, f.bold, C.suave);
    y -= 24;
  };
  tableHeader();

  const concepts = [
    ...o.items.map((i) => ({
      ref: refs.get(i.effiArticleId) ?? "",
      desc: `${i.productName}${i.optionName ? ` · ${i.optionName}` : ""}`,
      note: i.note ? `Personalización: ${i.note}` : "",
      qty: i.quantity,
      price: i.unitPrice,
    })),
    ...(o.shipping > 0
      ? [{ ref: "", desc: `Domicilio · ${o.city}`, note: "", qty: 1, price: o.shipping }]
      : []),
  ];
  concepts.forEach((c, idx) => {
    const lines = wrap(c.desc, f.regular, 8.5, descW);
    const notes = c.note ? wrap(c.note, f.regular, 7.5, descW) : [];
    const rowH = 8 + lines.length * 11 + notes.length * 9.5 + 4;
    if (y - rowH < M + 60) {
      newPage();
      tableHeader();
    }
    if (idx % 2 === 1) page.drawRectangle({ x: M, y: y - rowH + 4, width: W - 2 * M, height: rowH, color: C.cremaClaro });
    const ry = y - 8;
    text(String(idx + 1), cols.item, ry, 8.5, f.regular, C.suave);
    text(c.ref, cols.ref, ry, 8, f.regular, C.suave);
    lines.forEach((l, k) => text(l, cols.desc, ry - k * 11, 8.5));
    notes.forEach((l, k) => text(l, cols.desc, ry - lines.length * 11 - k * 9.5 + 1, 7.5, f.regular, C.suave));
    textRight(String(c.qty), cols.qty, ry, 8.5);
    textRight(formatCOP(c.price), cols.price, ry, 8.5);
    textRight(formatCOP(0), cols.disc, ry, 8.5, f.regular, C.suave);
    textRight(formatCOP(c.price * c.qty), cols.total, ry, 8.5, f.bold);
    y -= rowH;
  });
  page.drawLine({ start: { x: M, y: y + 2 }, end: { x: W - M, y: y + 2 }, thickness: 1, color: C.carbon });
  const units = concepts.reduce((n, c) => n + c.qty, 0);
  y -= 12;
  textRight(`Total ítems: ${concepts.length} · Total unidades: ${units}`, W - M - 10, y, 7.5, f.regular, C.suave);
  y -= 16;

  // ─── Pago y totales ───
  const blockH = 96;
  // Pago, totales, observación (hasta ~90) y el agradecimiento van juntos: si no caben, a la página siguiente
  if (y - (blockH + 12 + 90 + 22 + 30) < M + 20) newPage();
  const leftW = W - 2 * M - 200 - 12;
  card(M, y, leftW, blockH, { fill: C.blanco });
  text("Pago", M + 12, y - 17, 10, f.display);
  const pay: [string, string][] = cod
    ? [
        ["Forma de pago", `Contraentrega · ${formatCOP(o.total)}`],
        ["Medio", "Efectivo o transferencia al recibir"],
        ["Estado", o.status === "entregado" ? "Cobrado" : "Pendiente de cobro"],
        ["Impuestos", "No registra impuestos ni retenciones"],
      ]
    : [
        ["Forma de pago", `Contado · ${formatCOP(o.total)}`],
        ["Medio", `Pago en línea con Wompi${o.paymentMethod ? ` (${paymentMethod(o.paymentMethod)})` : ""}`],
        ["Transacción", o.wompiTransactionId ?? "—"],
        ["Impuestos", "No registra impuestos ni retenciones"],
      ];
  pay.forEach(([k, v], i) => {
    text(k, M + 12, y - 33 - i * 14, 7.5, f.bold, C.suave);
    text(v, M + 92, y - 33 - i * 14, 8.5);
  });

  const tx = W - M - 200;
  card(tx, y, 200, blockH, { fill: C.blanco });
  const tot: [string, string][] = [
    ["Subtotal productos", formatCOP(o.subtotal)],
    ["Descuento", formatCOP(0)],
    ["Envío", o.shippingZone === "nacional" ? "Al cobro" : o.shippingZone === "recoger" ? "Recoge" : formatCOP(o.shipping)],
  ];
  tot.forEach(([k, v], i) => {
    text(k, tx + 12, y - 18 - i * 14, 8.5, f.regular, C.suave);
    textRight(v, tx + 188, y - 18 - i * 14, 8.5, f.bold);
  });
  card(tx + 8, y - 58, 184, 30, { fill: C.estrella, r: 8 });
  text(cod && o.status !== "entregado" ? "TOTAL A PAGAR" : "TOTAL", tx + 18, y - 77, 9, f.bold);
  textRight(formatCOP(o.total), tx + 182, y - 78, 15, f.display);
  y -= blockH + 12;

  // ─── Observación y recibido ───
  const obs = [
    ...new Set(o.items.filter((i) => i.note).map((i) => `${i.productName}: ${i.note}`)),
    o.shippingNote ?? "",
    o.effiRemisionId ? "" : "Remisión de Effi pendiente.",
  ].filter(Boolean);
  const obsLines = obs.length ? obs.flatMap((s) => wrap(s, f.regular, 8, leftW - 24)).slice(0, 5) : ["Sin observaciones."];
  const obsH = Math.max(70, 30 + obsLines.length * 11);
  card(M, y, leftW, obsH, { fill: C.blanco });
  text("Observación", M + 12, y - 17, 10, f.display);
  obsLines.forEach((l, i) => text(l, M + 12, y - 32 - i * 11, 8, f.regular, obs.length ? C.carbon : C.suave));
  card(tx, y, 200, obsH, { fill: C.blanco });
  text("Recibí a satisfacción", tx + 12, y - 17, 10, f.display);
  page.drawLine({ start: { x: tx + 14, y: y - obsH + 24 }, end: { x: tx + 186, y: y - obsH + 24 }, thickness: 0.8, color: C.suave });
  textCenter("Nombre, documento y fecha", tx + 100, y - obsH + 12, 7, f.regular, C.suave);
  y -= obsH + 22;

  // ─── Cierre ───
  textCenter("¡Gracias por iluminar tu vida con Lusarte!", W / 2, y, 15, f.hand);

  const pages = pdf.getPages();
  pages.forEach((p, i) => {
    page = p;
    page.drawLine({ start: { x: M, y: M + 14 }, end: { x: W - M, y: M + 14 }, thickness: 0.6, color: C.linea });
    text("Comprobante de venta emitido por la tienda en línea de Lusarte. No es una factura electrónica de venta.", M, M + 3, 6.8, f.regular, C.suave);
    textRight(`Página ${i + 1} de ${pages.length}`, W - M, M + 3, 6.8, f.regular, C.suave);
  });

  return Buffer.from(await pdf.save());
}
