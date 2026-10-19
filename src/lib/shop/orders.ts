import "server-only";
import { randomBytes } from "node:crypto";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { after } from "next/server";
import { z } from "zod";
import { lineKey, MAX_QTY, NOTE_MAX, type CartRequest, type QuotedLine } from "@/lib/cart/types";
import { CATALOG_TAG, loadProducts, toPublicCatalog } from "@/lib/catalog/queries";
import { availableUnits, type Product, type ProductOption } from "@/lib/catalog/types";
import { db, schema } from "@/lib/db";
import { createRemision } from "@/lib/effi/sales";
import { sendOrderEmail } from "@/lib/email/order-emails";
import type { EmailKind } from "@/lib/email/templates";
import { shippingCost } from "./config";
import { findCity, findDepartment } from "./places";
import type { WompiTransaction } from "./wompi";

export type OrderStatus = "pendiente_pago" | "pagado" | "rechazado" | "despachado";

export const cartRequestSchema = z
  .array(
    z.object({
      optionId: z.number().int().positive(),
      quantity: z.number().int().min(1).max(MAX_QTY),
      note: z.string().max(NOTE_MAX).default(""),
    }),
  )
  .max(100);

const text = (max: number) => z.string().trim().min(1, "Este campo es obligatorio").max(max);

/** Tipos de documento de Effi (t_dni) que se aceptan en el checkout. */
export const LEGAL_ID_TYPES = { "2": "Cédula de ciudadanía", "4": "Cédula de extranjería", "1": "NIT", "3": "Pasaporte" } as const;

export const customerSchema = z
  .object({
    name: text(120),
    email: z.email("Revisa el correo").max(160),
    phone: z
      .string()
      .trim()
      .transform((s) => s.replace(/[\s()-]/g, "").replace(/^\+?57/, ""))
      .pipe(z.string().regex(/^3\d{9}$|^60\d{8}$/, "Escribe un celular de 10 dígitos")),
    legalIdType: z.enum(Object.keys(LEGAL_ID_TYPES) as ["2", "4", "1", "3"], "Elige el tipo de documento").transform(Number),
    legalId: z
      .string()
      .trim()
      .transform((s) => s.replace(/[.\s-]/g, "").toUpperCase())
      .pipe(z.string().regex(/^[0-9A-Z]{5,15}$/, "Escribe tu número de documento, sin puntos")),
    departmentId: z.coerce.number<string>("Elige el departamento").int().positive("Elige el departamento"),
    city: text(80),
    address: text(200),
    addressNotes: z
      .string()
      .trim()
      .max(200)
      .transform((s) => s || null),
    terms: z.literal("on", "Debes aceptar los términos y la política de datos"),
  })
  .superRefine((c, ctx) => {
    if (c.legalIdType !== 3 && !/^\d+$/.test(c.legalId)) ctx.addIssue({ code: "custom", path: ["legalId"], message: "Escribe solo números" });
    if (!findDepartment(c.departmentId)) ctx.addIssue({ code: "custom", path: ["departmentId"], message: "Elige el departamento" });
    else if (!findCity(c.departmentId, c.city)) ctx.addIssue({ code: "custom", path: ["city"], message: "Elige un municipio de la lista" });
  })
  .transform(({ departmentId, city, ...c }) => {
    const dept = findDepartment(departmentId)!;
    const place = findCity(departmentId, city)!;
    return { ...c, department: dept.name, city: place.name, effiProvinceId: dept.id, effiCityId: place.id };
  });

export type Customer = z.infer<typeof customerSchema>;

/** Índice optionId → producto y presentación, sobre el catálogo público. */
function indexOptions(catalog: Product[]) {
  const map = new Map<number, { product: Product; option: ProductOption }>();
  for (const product of catalog) for (const option of product.options) map.set(option.id, { product, option });
  return map;
}

/** Precios y disponibilidad vigentes para las líneas del carrito (para mostrar). */
export function quoteLines(catalog: Product[], lines: CartRequest): QuotedLine[] {
  const index = indexOptions(catalog);
  return lines.map((l) => {
    const hit = index.get(l.optionId);
    const units = hit ? availableUnits(hit.option) : 0;
    return {
      key: lineKey(l),
      ok: units > 0,
      price: hit?.option.price ?? 0,
      max: units === Infinity ? null : units,
      productName: hit?.product.name ?? "",
      optionName: hit && hit.product.options.length > 1 ? hit.option.name : null,
      slug: hit?.product.slug ?? "",
      image: hit?.product.images[0]?.url ?? null,
    };
  });
}

export class CartError extends Error {}

/**
 * Después de responder (no hace esperar a Wompi ni al cliente): con un pago aprobado, primero la remisión
 * en Effi y luego los correos, que ya llevan su número.
 */
function sendLater(code: string, kinds: EmailKind[], { remision = false } = {}) {
  const run = async () => {
    if (remision) await createRemision(code);
    await Promise.all(kinds.map((k) => sendOrderEmail(code, k)));
  };
  try {
    after(run);
  } catch {
    // Fuera de una petición (scripts): se envían de una vez
    void run();
  }
}

/**
 * Crea el pedido en pendiente_pago con precios y stock leídos ahora mismo (sin caché).
 * Lanza CartError si algo del carrito ya no se puede vender.
 */
export async function createOrder(customer: Customer, lines: CartRequest) {
  if (lines.length === 0) throw new CartError("Tu carrito está vacío.");
  const admin = await loadProducts();
  const index = indexOptions(toPublicCatalog(admin));
  const effiIdBy = new Map(admin.flatMap((p) => p.options.map((o) => [o.id, o.effiArticleId] as const)));

  // Varias líneas de la misma presentación (con distinta personalización) comparten el stock
  const totals = new Map<number, number>();
  for (const l of lines) totals.set(l.optionId, (totals.get(l.optionId) ?? 0) + l.quantity);

  for (const [optionId, qty] of totals) {
    const hit = index.get(optionId);
    if (!hit) throw new CartError("Un producto de tu carrito ya no está a la venta. Revisa el carrito.");
    const units = availableUnits(hit.option);
    const label = `${hit.product.name}${hit.product.options.length > 1 ? ` (${hit.option.name})` : ""}`;
    if (units === 0) throw new CartError(`${label} se agotó. Quítalo del carrito para continuar.`);
    if (qty > units) throw new CartError(`De ${label} solo quedan ${units}. Ajusta la cantidad en el carrito.`);
  }

  const items = lines.map((l) => {
    const { product, option } = index.get(l.optionId)!;
    return {
      productId: product.id,
      optionId: option.id,
      effiArticleId: effiIdBy.get(option.id)!,
      productName: product.name,
      optionName: product.options.length > 1 ? option.name : "",
      unitPrice: option.price,
      quantity: l.quantity,
      note: l.note.trim() || null,
    };
  });
  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const shipping = shippingCost();
  const token = randomBytes(24).toString("base64url");

  const code = await db.transaction(async (tx) => {
    const [res] = await tx.insert(schema.orders).values({ ...customer, token, subtotal, shipping, total: subtotal + shipping });
    const id = res.insertId;
    const code = `LUS-${String(id).padStart(6, "0")}`;
    await tx.update(schema.orders).set({ code }).where(eq(schema.orders.id, id));
    await tx.insert(schema.orderItems).values(items.map((i) => ({ ...i, orderId: id })));
    return code;
  });

  return { code, token, total: subtotal + shipping };
}

export async function getOrder(code: string) {
  const [order] = await db.select().from(schema.orders).where(eq(schema.orders.code, code)).limit(1);
  if (!order) return null;
  const items = await db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, order.id)).orderBy(schema.orderItems.id);
  return { ...order, items };
}

export type OrderWithItems = NonNullable<Awaited<ReturnType<typeof getOrder>>>;

export async function listOrders(statuses?: OrderStatus[]) {
  const q = db.select().from(schema.orders).orderBy(desc(schema.orders.createdAt)).limit(200);
  return statuses ? q.where(inArray(schema.orders.status, statuses)) : q;
}

/**
 * Aplica el estado de una transacción de Wompi al pedido. Idempotente: si Wompi repite el evento,
 * o el webhook y la página de confirmación llegan a la vez, solo uno hace el cambio.
 */
export async function applyTransaction(t: WompiTransaction) {
  const [order] = await db.select().from(schema.orders).where(eq(schema.orders.code, t.reference)).limit(1);
  if (!order) return null;

  if (t.status === "APPROVED" && (t.amount_in_cents !== order.total * 100 || t.currency !== "COP")) {
    console.error(`Wompi: el monto de ${t.reference} no coincide (${t.amount_in_cents} ${t.currency}, esperado ${order.total * 100} COP)`);
    return order.status;
  }

  const payment = { wompiTransactionId: t.id, wompiStatus: t.status, paymentMethod: t.payment_method_type ?? null };

  if (t.status === "APPROVED") {
    const changed = await db.transaction(async (tx) => {
      const [res] = await tx
        .update(schema.orders)
        .set({ ...payment, status: "pagado", paidAt: new Date() })
        .where(and(eq(schema.orders.id, order.id), inArray(schema.orders.status, ["pendiente_pago", "rechazado"])));
      if (res.affectedRows !== 1) return false;

      // Descuenta en la copia local de Effi para que la tienda no venda lo que ya no hay.
      // La próxima sincronización trae el stock real de Effi (que lo descuenta con la remisión).
      const items = await tx.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, order.id));
      let alert = false;
      for (const i of items) {
        await tx
          .update(schema.effiArticles)
          .set({ stock: sql`${schema.effiArticles.stock} - ${i.quantity}` })
          .where(and(eq(schema.effiArticles.id, i.effiArticleId), sql`${schema.effiArticles.gestionStock} > 1`));
        const [a] = await tx
          .select({ stock: schema.effiArticles.stock, gestion: schema.effiArticles.gestionStock })
          .from(schema.effiArticles)
          .where(eq(schema.effiArticles.id, i.effiArticleId));
        if (a && a.gestion > 1 && a.stock < 0) alert = true;
      }
      if (alert) await tx.update(schema.orders).set({ stockAlert: true }).where(eq(schema.orders.id, order.id));
      return true;
    });
    if (changed) {
      try {
        revalidateTag(CATALOG_TAG, { expire: 0 });
      } catch {
        // Fuera de una petición (scripts) no se puede invalidar; el caché vence solo
      }
      sendLater(order.code!, ["confirmacion", "venta"], { remision: true });
    }
    return "pagado";
  }

  if (t.status === "DECLINED" || t.status === "VOIDED" || t.status === "ERROR") {
    const [res] = await db
      .update(schema.orders)
      .set({ ...payment, status: "rechazado" })
      .where(and(eq(schema.orders.id, order.id), eq(schema.orders.status, "pendiente_pago")));
    if (res.affectedRows !== 1) return order.status;
    sendLater(order.code!, ["pago_fallido"]);
    return "rechazado";
  }

  // PENDING: guardar la transacción para poder consultarla después
  await db
    .update(schema.orders)
    .set(payment)
    .where(and(eq(schema.orders.id, order.id), eq(schema.orders.status, "pendiente_pago")));
  return order.status;
}

export const shipmentSchema = z.object({
  carrier: text(80),
  trackingNumber: text(80),
  trackingUrl: z
    .string()
    .trim()
    .max(500)
    .refine((s) => s === "" || /^https?:\/\/[^\s]+\.[^\s]+/.test(s), "Pega el link completo (empieza con https://)")
    .transform((s) => s || null),
  shippingNote: z
    .string()
    .trim()
    .max(500)
    .transform((s) => s || null),
});

export type Shipment = z.infer<typeof shipmentSchema>;

/**
 * Marca el pedido como despachado (o corrige los datos de la guía si ya lo estaba).
 * Devuelve si es el primer despacho, para enviar el correo solo esa vez de forma automática.
 */
export async function shipOrder(code: string, data: Shipment) {
  const [order] = await db.select().from(schema.orders).where(eq(schema.orders.code, code)).limit(1);
  if (!order) throw new CartError("No encontramos el pedido.");
  if (order.status !== "pagado" && order.status !== "despachado") throw new CartError("Solo se pueden despachar pedidos pagados.");
  const first = order.status === "pagado";
  await db
    .update(schema.orders)
    .set({ ...data, status: "despachado", shippedAt: order.shippedAt ?? new Date() })
    .where(eq(schema.orders.id, order.id));
  return { first };
}

/** Transportadoras ya usadas, para autocompletar. */
export async function usedCarriers() {
  const list = await db
    .selectDistinct({ carrier: schema.orders.carrier })
    .from(schema.orders)
    .where(sql`${schema.orders.carrier} is not null`)
    .limit(50);
  return list.map((r) => r.carrier!).sort((a, b) => a.localeCompare(b));
}
