import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage } from "pdf-lib";
import { formatCOP } from "@/lib/format";
import { LEGAL_ID_TYPES, type OrderWithItems } from "@/lib/shop/orders";
import { site } from "@/lib/site";
import { paymentMethod } from "./templates";

// Comprobante del pedido en PDF (Effi no entrega el PDF de la remisión por la API).
// Va adjunto a la confirmación del cliente y al aviso de venta, con el número de la remisión de Effi.

const hex = (h: string) => rgb(parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255);
const C = { carbon: hex("#383939"), suave: hex("#5b5c5b"), crema: hex("#efebe0"), cremaClaro: hex("#f7f4ec"), lavanda: hex("#dcc5e0"), estrella: hex("#f5eca0") };

/** Las fuentes estándar del PDF solo tienen Latin-1: se quitan emojis y símbolos fuera de ese rango. */
const safe = (s: string) =>
  s
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/[^\x20-\x7e\xa0-\xff]/g, "");

function wrap(text: string, font: PDFFont, size: number, width: number) {
  const lines: string[] = [];
  for (const para of safe(text).split("\n")) {
    let line = "";
    for (const word of para.split(" ")) {
      const next = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(next, size) > width && line) {
        lines.push(line);
        line = word;
      } else line = next;
    }
    lines.push(line);
  }
  return lines;
}

const dateFmt = new Intl.DateTimeFormat("es-CO", { dateStyle: "long", timeStyle: "short", timeZone: "America/Bogota" });

export async function receiptPdf(o: OrderWithItems): Promise<Buffer> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Lusarte · Pedido ${o.code}`);
  pdf.setAuthor(site.name);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const W = 595.28;
  const H = 841.89;
  const M = 48;
  let page: PDFPage = pdf.addPage([W, H]);
  let y = H - M;

  const text = (s: string, x: number, size = 10, font = regular, color = C.carbon) => page.drawText(safe(s), { x, y, size, font, color });
  const right = (s: string, xRight: number, size = 10, font = regular, color = C.carbon) =>
    page.drawText(safe(s), { x: xRight - font.widthOfTextAtSize(safe(s), size), y, size, font, color });
  const ensure = (h: number) => {
    if (y - h > M + 40) return;
    page = pdf.addPage([W, H]);
    y = H - M;
  };

  // Encabezado: logo + datos del pedido
  try {
    const png = await pdf.embedPng(await readFile(path.join(process.cwd(), "public", "email", "logo.png")));
    const w = 150;
    page.drawImage(png, { x: M, y: y - (w * png.height) / png.width, width: w, height: (w * png.height) / png.width });
  } catch {
    text(site.name, M, 26, bold);
  }
  right("Comprobante de compra", W - M, 16, bold);
  y -= 18;
  right(`Pedido ${o.code}`, W - M, 11, bold, C.suave);
  y -= 14;
  right(dateFmt.format(o.paidAt ?? o.createdAt), W - M, 9, regular, C.suave);
  if (o.effiRemisionId) {
    y -= 14;
    right(`Remisión de venta N.º ${o.effiRemisionId}`, W - M, 9, bold, C.carbon);
  }
  y -= 40;

  // Cliente y envío
  const boxH = 92;
  page.drawRectangle({ x: M, y: y - boxH, width: W - 2 * M, height: boxH, color: C.lavanda, borderColor: C.carbon, borderWidth: 1.5 });
  const col2 = M + (W - 2 * M) / 2 + 8;
  y -= 20;
  text("Cliente", M + 14, 10, bold);
  text("Envío a", col2, 10, bold);
  const docType = LEGAL_ID_TYPES[String(o.legalIdType) as keyof typeof LEGAL_ID_TYPES] ?? "Documento";
  const leftLines = [o.name, o.legalId ? `${docType} ${o.legalId}` : "", o.email, o.phone].filter(Boolean);
  const rightLines = [...wrap(`${o.address}${o.addressNotes ? ` (${o.addressNotes})` : ""}`, regular, 9.5, (W - 2 * M) / 2 - 26), `${o.city}, ${o.department}`];
  const top = y;
  for (const l of leftLines) {
    y -= 13.5;
    text(l, M + 14, 9.5);
  }
  y = top;
  for (const l of rightLines.slice(0, 4)) {
    y -= 13.5;
    text(l, col2, 9.5);
  }
  y = top - boxH + 2;

  // Productos
  y -= 26;
  const colQty = W - M - 150;
  const colUnit = W - M - 80;
  page.drawRectangle({ x: M, y: y - 7, width: W - 2 * M, height: 22, color: C.carbon });
  text("Producto", M + 10, 9.5, bold, C.crema);
  right("Cant.", colQty, 9.5, bold, C.crema);
  right("Precio", colUnit, 9.5, bold, C.crema);
  right("Total", W - M - 10, 9.5, bold, C.crema);
  y -= 26;
  for (const i of o.items) {
    const name = wrap(`${i.productName}${i.optionName ? ` · ${i.optionName}` : ""}`, regular, 9.5, colQty - M - 60);
    const note = i.note ? wrap(`Personalización: ${i.note}`, regular, 8.5, colQty - M - 60) : [];
    ensure(16 * (name.length + note.length) + 10);
    text(name[0], M + 10, 9.5);
    right(String(i.quantity), colQty, 9.5);
    right(formatCOP(i.unitPrice), colUnit, 9.5);
    right(formatCOP(i.unitPrice * i.quantity), W - M - 10, 9.5, bold);
    for (const l of name.slice(1)) {
      y -= 12;
      text(l, M + 10, 9.5);
    }
    for (const l of note) {
      y -= 11.5;
      text(l, M + 10, 8.5, regular, C.suave);
    }
    y -= 9;
    page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 0.6, color: hex("#d9d3c3") });
    y -= 14;
  }

  // Totales
  ensure(90);
  const totals: [string, string, boolean][] = [
    ["Subtotal", formatCOP(o.subtotal), false],
    ["Envío", formatCOP(o.shipping), false],
    ["Total pagado", formatCOP(o.total), true],
  ];
  for (const [label, value, strong] of totals) {
    if (strong) {
      y -= 12;
      page.drawRectangle({ x: W - M - 220, y: y - 9, width: 220, height: 28, color: C.estrella, borderColor: C.carbon, borderWidth: 1.5 });
    }
    right(label, W - M - 110, strong ? 12 : 10, strong ? bold : regular);
    right(value, W - M - 10, strong ? 12 : 10, bold);
    y -= strong ? 30 : 17;
  }

  // Pago
  y -= 8;
  text("Pago", M, 10, bold);
  y -= 14;
  text(`Wompi${o.paymentMethod ? ` · ${paymentMethod(o.paymentMethod)}` : ""} · transacción ${o.wompiTransactionId ?? "—"} · estado: aprobado`, M, 9, regular, C.suave);

  // Pie
  for (const p of pdf.getPages()) {
    p.drawLine({ start: { x: M, y: M + 22 }, end: { x: W - M, y: M + 22 }, thickness: 0.6, color: hex("#d9d3c3") });
    p.drawText(safe(`${site.name} · ${site.tagline} · WhatsApp ${site.phone} · Instagram @${site.instagram} · lusarte.net`), {
      x: M,
      y: M + 8,
      size: 8,
      font: regular,
      color: C.suave,
    });
  }

  return Buffer.from(await pdf.save());
}
