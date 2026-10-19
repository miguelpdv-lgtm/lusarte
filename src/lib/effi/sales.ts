import "server-only";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { wompiConfig } from "@/lib/shop/config";
import { getOrder, type OrderWithItems } from "@/lib/shop/orders";
import { COLOMBIA } from "@/lib/shop/places";
import { EffiError, effiRequest } from "./client";

// Remisión de venta en Effi por cada pedido pagado de la tienda (docs/EFFI.md → Remisiones de la tienda).
// Se crea igual que las que la clienta registra a mano: sucursal/bodega/caja 1, centro de costos "Whatsapp",
// contado por transferencia bancaria a la cuenta Nequi, más el DOMICILIO con el valor del envío.

const VENTA = {
  sucursal: 1,
  bodega: 1,
  centroCostos: 1,
  formaPagoContado: 1,
  /** "Transferencia bancaria": el medio que usa la clienta para Nequi */
  medioPago: 5,
  caja: { sucursal: 1, id: 1 },
  /** Cuenta Nequi, a donde Wompi transfiere los pagos */
  cuenta: 1,
  /** Artículo de servicio para el envío */
  domicilio: 492,
};

/**
 * Las remisiones solo se crean con Wompi en producción: un pago de prueba (sandbox) crearía una venta real en Effi.
 * EFFI_REMISIONES=siempre las fuerza (para probar a propósito); EFFI_REMISIONES=nunca las apaga.
 */
export function remisionesMode(): { on: boolean; reason?: string } {
  const flag = process.env.EFFI_REMISIONES?.trim().toLowerCase();
  if (!process.env.EFFI_API_KEY) return { on: false, reason: "Falta EFFI_API_KEY" };
  if (flag === "nunca") return { on: false, reason: "Desactivadas (EFFI_REMISIONES=nunca)" };
  if (flag === "siempre") return { on: true };
  if (wompiConfig()?.sandbox !== false) return { on: false, reason: "Wompi está en modo de pruebas: no se crean ventas reales en Effi" };
  return { on: true };
}

const clip = (s: string, max: number) => (s.length > max ? `${s.slice(0, max - 1)}…` : s);

type EffiCliente = { tercero: string; id: string; t_dni: string };

/** Busca el cliente por documento; si no existe, lo crea con su dirección. Devuelve el código de tercero. */
async function ensureClient(o: OrderWithItems): Promise<number> {
  if (!o.legalId || !o.legalIdType) throw new EffiError("El pedido no tiene documento del cliente", 0);
  const find = async () => {
    const res = await effiRequest<EffiCliente[]>("GET", "cliente", undefined, { numero: o.legalId!, pagina: 1, por_pagina: 5 });
    return res.ok ? res.data.find((c) => Number(c.t_dni) === o.legalIdType) ?? res.data[0] : undefined;
  };
  const found = await find();
  if (found) return Number(found.tercero);

  try {
    const res = await effiRequest<{ tercero: string }>("POST", "cliente", {
      t_dni: o.legalIdType,
      numero: o.legalId,
      nombre: clip(o.name.toUpperCase(), 120),
      email: o.email,
      celular: o.phone,
      whatsapp: o.phone,
      direcciones: [
        {
          id_pais: COLOMBIA,
          id_provincia: o.effiProvinceId,
          id_ciudad: o.effiCityId,
          direccion: o.address,
          referencia: o.addressNotes ?? "",
        },
      ],
      observacion: `Creado por la tienda web (${o.code})`,
    });
    if (res.ok) return Number(res.data.tercero);
  } catch (e) {
    // Si otro proceso lo creó al mismo tiempo, Effi responde que ya es cliente: se busca de nuevo
    const again = await find();
    if (again) return Number(again.tercero);
    throw e;
  }
  throw new EffiError("Effi no devolvió el cliente creado", 0);
}

function remisionBody(o: OrderWithItems, cliente: number) {
  const lines = o.items.map((i) => ({
    articulo: i.effiArticleId,
    descripcion: clip(`${i.productName}${i.optionName ? ` ${i.optionName}` : ""}`, 255),
    cantidad: i.quantity,
    precio: i.unitPrice,
    observacion: i.note ? clip(`Personalización: ${i.note}`, 255) : "",
  }));
  if (o.shipping > 0) lines.push({ articulo: VENTA.domicilio, descripcion: "DOMICILIO", cantidad: 1, precio: o.shipping, observacion: "" });
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Bogota" });

  return {
    idempotency_key: o.code,
    sucursal: VENTA.sucursal,
    bodega: VENTA.bodega,
    centro_costos: VENTA.centroCostos,
    fecha_entrega: today,
    divisa: "COP",
    trm: 1,
    cliente,
    id_pais_cliente: COLOMBIA,
    id_provincia_cliente: o.effiProvinceId,
    id_ciudad_cliente: o.effiCityId,
    direccion_cliente: clip(o.address, 200),
    referencia_cliente: o.addressNotes ?? "",
    observacion: clip(`Pedido web ${o.code} · Wompi ${o.wompiTransactionId ?? ""}`, 255),
    articulo: lines.map((l) => l.articulo),
    descripcion: lines.map((l) => l.descripcion),
    cantidad: lines.map((l) => l.cantidad),
    precio: lines.map((l) => l.precio),
    descuento: lines.map(() => 0),
    gift: lines.map(() => 0),
    observacion_concepto: lines.map((l) => l.observacion),
    t_forma_pago: [VENTA.formaPagoContado],
    valor_forma_pago: [o.total],
    medio_pago: [VENTA.medioPago],
    sucursal_caja_medio_pago: [VENTA.caja.sucursal],
    id_caja_medio_pago: [VENTA.caja.id],
    cuenta_medio_pago: [VENTA.cuenta],
    valor_medio_pago: [o.total],
    observacion_medio_pago: [clip(`Wompi ${o.paymentMethod ?? ""} ${o.wompiTransactionId ?? ""}`.trim(), 255)],
  };
}

const saveResult = (orderId: number, set: Partial<typeof schema.orders.$inferInsert>) => db.update(schema.orders).set(set).where(eq(schema.orders.id, orderId));

/**
 * Crea la remisión del pedido pagado. Idempotente: el código del pedido es la idempotency_key, así que un
 * reintento nunca duplica la venta. Nunca lanza: el error queda en el pedido para reintentar desde el panel.
 * Devuelve el id de la remisión, o null si no se creó.
 */
export async function createRemision(code: string, { force = false } = {}): Promise<number | null> {
  const o = await getOrder(code);
  if (!o || (o.status !== "pagado" && o.status !== "despachado")) return null;
  if (o.effiRemisionId) return o.effiRemisionId;
  const mode = remisionesMode();
  if (!mode.on && !force) {
    await saveResult(o.id, { effiRemisionError: mode.reason ?? "Remisiones desactivadas" });
    return null;
  }

  try {
    const cliente = o.effiClient ?? (await ensureClient(o));
    if (!o.effiClient) await saveResult(o.id, { effiClient: cliente });
    let id: number;
    try {
      const res = await effiRequest<{ id: number | string }>("POST", "remision_v", remisionBody(o, cliente));
      id = Number(res.ok ? res.data.id : NaN);
    } catch (e) {
      // 409: ya existía (reintento): Effi indica cuál es
      const m = e instanceof EffiError && e.status === 409 ? /id (\d+)\)/.exec(e.message) : null;
      if (!m) throw e;
      id = Number(m[1]);
    }
    if (!Number.isFinite(id)) throw new EffiError("Effi no devolvió el número de la remisión", 0);
    await saveResult(o.id, { effiRemisionId: id, effiRemisionError: null });
    return id;
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error(`Remisión de ${code} falló:`, message);
    await saveResult(o.id, { effiRemisionError: clip(message, 500) });
    return null;
  }
}

/** Al despachar: agrega la transportadora y la guía a la observación de la remisión (si existe). */
export async function noteShipment(code: string) {
  const o = await getOrder(code);
  if (!o?.effiRemisionId || !o.trackingNumber) return;
  try {
    await effiRequest("PUT", "remision_v", {
      sucursal: VENTA.sucursal,
      id: o.effiRemisionId,
      observacion: clip(`Pedido web ${o.code} · Wompi ${o.wompiTransactionId ?? ""} · Despachado: ${o.carrier} guía ${o.trackingNumber}`, 255),
    });
  } catch (e) {
    console.error(`No se pudo anotar la guía en la remisión de ${code}:`, e);
  }
}
