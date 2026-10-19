import "server-only";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { effiRequest } from "./client";
import { TARIFA_ESPECIAL, TARIFA_WEB } from "./sync";

// Escrituras en Effi desde el panel. Effi es la fuente de verdad: cada cambio se hace allá primero
// y, si Effi lo acepta, se actualiza la copia local (effi_articles) con lo que Effi devuelve.

/** Sucursal y bodega de Lusarte en Effi (api/sucursal, api/bodega) */
export const EFFI_SUCURSAL = 1;
export const EFFI_BODEGA = 1;
/** Producto terminado (api/t_articulo) */
const T_PRODUCTO_TERMINADO = 3;
/** Gestión de stock: 3 = control por bodega; 1 = sin control (se vende sin límite) */
export const GESTION_CONTROL = 3;
export const GESTION_SIN_CONTROL = 1;

type EffiArticuloEscrito = {
  id: string | number;
  descripcion: string;
  referencia: string | null;
  categoria: string | number | null;
  nombre_categoria: string | null;
  precios?: { tarifa_precio: string | number; p_venta: string | number }[];
  gestion_stock: string | number;
  stock_minimo: string | number | null;
  t_articulo: string | number;
  vigente?: string | number;
};

/** Actualiza la copia local con la respuesta de Effi (POST/PUT devuelven el artículo; el stock no viene). */
async function storeArticle(a: EffiArticuloEscrito) {
  const price = (tarifa: number) => Math.round(Number(a.precios?.find((p) => Number(p.tarifa_precio) === tarifa)?.p_venta ?? 0));
  const row = {
    id: Number(a.id),
    nombre: a.descripcion.trim().slice(0, 160),
    referencia: a.referencia?.trim() || null,
    categoriaId: a.categoria ? Number(a.categoria) : null,
    categoriaNombre: a.nombre_categoria,
    precio: price(TARIFA_WEB.id),
    precioEspecial: price(TARIFA_ESPECIAL.id),
    gestionStock: Number(a.gestion_stock),
    stockMinimo: Math.floor(Number(a.stock_minimo ?? 0)),
    tipoArticulo: Number(a.t_articulo),
    vigente: a.vigente === undefined ? true : String(a.vigente) === "1",
  };
  await db
    .insert(schema.effiArticles)
    .values(row)
    .onDuplicateKeyUpdate({ set: { ...row, id: undefined, syncedAt: new Date() } });
  return row;
}

export type NewArticle = {
  nombre: string;
  referencia: string | null;
  categoriaId: number | null;
  precio: number;
  precioEspecial: number;
  stockMinimo: number;
  controlStock: boolean;
  descripcionDetallada: string;
};

export async function createEffiArticle(a: NewArticle) {
  const res = await effiRequest<EffiArticuloEscrito>("POST", "articulo", {
    descripcion: a.nombre.slice(0, 120),
    ...(a.referencia && { referencia: a.referencia.slice(0, 40) }),
    sucursal: EFFI_SUCURSAL,
    t_articulo: T_PRODUCTO_TERMINADO,
    ...(a.categoriaId && { categoria: a.categoriaId }),
    gestion_stock: a.controlStock ? GESTION_CONTROL : GESTION_SIN_CONTROL,
    ...(a.controlStock && { stock_minimo: a.stockMinimo }),
    compras: true,
    ventas: true,
    precios: [
      { tarifa_precio: TARIFA_WEB.id, p_venta: a.precio },
      { tarifa_precio: TARIFA_ESPECIAL.id, p_venta: a.precioEspecial },
    ],
    ...(a.descripcionDetallada && { descripcion_detallada: a.descripcionDetallada.slice(0, 2024) }),
  });
  if (!res.ok) throw new Error("Effi no creó el artículo");
  return storeArticle(res.data);
}

export type ArticlePatch = Partial<{
  nombre: string;
  referencia: string | null;
  categoriaId: number | null;
  precio: number;
  precioEspecial: number;
  stockMinimo: number;
  descripcionDetallada: string;
}>;

/** Modifica un artículo en Effi. Si cambia una tarifa se reenvían las dos (Effi reemplaza el conjunto). */
export async function updateEffiArticle(id: number, patch: ArticlePatch) {
  const [current] = await db.select().from(schema.effiArticles).where(eq(schema.effiArticles.id, id));
  if (!current) throw new Error(`El artículo #${id} no está en la copia local; sincroniza primero.`);
  const body: Record<string, unknown> = { id };
  if (patch.nombre !== undefined) body.descripcion = patch.nombre.slice(0, 120);
  if (patch.referencia !== undefined) body.referencia = patch.referencia ?? "";
  if (patch.categoriaId !== undefined && patch.categoriaId !== null) body.categoria = patch.categoriaId;
  if (patch.stockMinimo !== undefined && current.gestionStock > 0) body.stock_minimo = patch.stockMinimo;
  if (patch.descripcionDetallada !== undefined) body.descripcion_detallada = patch.descripcionDetallada.slice(0, 2024);
  if (patch.precio !== undefined || patch.precioEspecial !== undefined) {
    body.precios = [
      { tarifa_precio: TARIFA_WEB.id, p_venta: patch.precio ?? current.precio },
      { tarifa_precio: TARIFA_ESPECIAL.id, p_venta: patch.precioEspecial ?? current.precioEspecial },
    ];
  }
  if (Object.keys(body).length === 1) return current;
  const res = await effiRequest<EffiArticuloEscrito>("PUT", "articulo", body);
  if (!res.ok) throw new Error("Effi no modificó el artículo");
  return storeArticle(res.data);
}

/** Anula el artículo en Effi (baja lógica: se puede reactivar desde Effi). */
export async function annulEffiArticle(id: number) {
  await effiRequest("DELETE", "articulo", { id });
  await db.update(schema.effiArticles).set({ vigente: false }).where(eq(schema.effiArticles.id, id));
}

/**
 * Lleva el stock de un artículo a `target` con un ajuste de inventario en Effi (ingreso o egreso por la diferencia).
 * Los ingresos usan el costo indicado o el costo promedio del artículo.
 */
export async function adjustEffiStock(id: number, target: number, costo?: number) {
  const [current] = await db.select().from(schema.effiArticles).where(eq(schema.effiArticles.id, id));
  if (!current) throw new Error(`El artículo #${id} no está en la copia local; sincroniza primero.`);
  if (current.gestionStock < 2) throw new Error("Este artículo no lleva control de stock en Effi.");
  const delta = target - current.stock;
  if (delta === 0) return current.stock;
  const cost = costo ?? current.costo;
  if (delta > 0 && cost <= 0) throw new Error("Para sumar unidades Effi necesita el costo unitario del artículo.");
  await effiRequest("POST", "ajuste_inventario", {
    idempotency_key: `web-aj-${id}-${Date.now()}`,
    sucursal: EFFI_SUCURSAL,
    bodega: EFFI_BODEGA,
    observacion: "Ajuste desde el panel de la tienda web",
    conceptos: [{ articulo: id, t_ajuste: delta > 0 ? 1 : 0, cantidad: Math.abs(delta), ...(delta > 0 && { costo: cost }) }],
  });
  await db.update(schema.effiArticles).set({ stock: target, ...(delta > 0 && costo ? { costo } : {}) }).where(eq(schema.effiArticles.id, id));
  return target;
}
