// Sincronización Effi → base local. La usan la app (en segundo plano y con el botón del panel)
// y el script `npm run effi:sync`.
import { and, eq, gte, inArray, max, sql } from "drizzle-orm";
import type { MySql2Database } from "drizzle-orm/mysql2";
import { effiCategoryMap } from "@/data/catalog";
import * as schema from "@/lib/db/schema";
import { slugify } from "@/lib/slug";
import { effiGetAll } from "./client";
import { groupKeyOf, sizeOrder, splitPresentation, titleCase } from "./grouping";

type Db = MySql2Database<typeof schema>;
const { effiArticles, effiCategories, effiSales, products, productOptions, productImages, syncState } = schema;

/** Tarifas de precio de Effi (api/tarifa_precio): la normal es la de la web. */
export const TARIFA_WEB = { id: 1, nombre: "Tarifa normal" };
export const TARIFA_ESPECIAL = { id: 2, nombre: "Tarifa especial" };

type EffiArticulo = {
  id: string;
  descripcion: string;
  referencia: string | null;
  categoria: string | null;
  nombre_categoria: string | null;
  precios_venta: string | null;
  gestion_stock: string;
  stock_empresa?: string;
  stock_minimo: string | null;
  p_costo?: string | null;
  p_costo_promedio?: string | null;
  t_articulo: string;
  ventas: string;
  vigente: string;
};

/** "Tarifa normal: 43000.0000; Tarifa especial: 0.0000" → { "Tarifa normal": 43000, … } */
function parsePrecios(text: string | null) {
  const out: Record<string, number> = {};
  for (const part of (text ?? "").split(";")) {
    const [name, value] = part.split(":");
    if (name && value) out[name.trim()] = Math.round(Number(value));
  }
  return out;
}

async function setState(db: Db, key: string, value: object) {
  const json = JSON.stringify(value);
  await db.insert(syncState).values({ key, value: json }).onDuplicateKeyUpdate({ set: { value: json } });
}

export async function getState(db: Db, key: string) {
  const [row] = await db.select().from(syncState).where(eq(syncState.key, key));
  return row ? { ...(JSON.parse(row.value) as SyncResult), updatedAt: row.updatedAt } : null;
}

export type SyncResult = { ok: boolean; at: string; error?: string; detalle?: string };

// ─── Artículos ───

export async function syncArticles(db: Db) {
  // Categorías de Effi (para elegirlas desde el panel)
  const cats = await effiGetAll<{ id: string; nombre: string; vigente: string }>("categoria_articulo");
  for (const c of cats) {
    const row = { id: Number(c.id), nombre: c.nombre.slice(0, 120), vigente: c.vigente === "1" };
    await db.insert(effiCategories).values(row).onDuplicateKeyUpdate({ set: { nombre: row.nombre, vigente: row.vigente } });
  }

  const raw = await effiGetAll<EffiArticulo>("articulo");
  const rows = raw.map((a) => {
    const precios = parsePrecios(a.precios_venta);
    return {
      id: Number(a.id),
      nombre: a.descripcion.trim().slice(0, 160),
      referencia: a.referencia?.trim() || null,
      categoriaId: a.categoria ? Number(a.categoria) : null,
      categoriaNombre: a.nombre_categoria,
      precio: precios[TARIFA_WEB.nombre] ?? 0,
      precioEspecial: precios[TARIFA_ESPECIAL.nombre] ?? 0,
      gestionStock: Number(a.gestion_stock),
      stock: Math.floor(Number(a.stock_empresa ?? 0)),
      stockMinimo: Math.floor(Number(a.stock_minimo ?? 0)),
      costo: Math.round(Number(a.p_costo_promedio || a.p_costo || 0)),
      tipoArticulo: Number(a.t_articulo),
      vigente: a.vigente === "1" && a.ventas === "1",
      syncedAt: new Date(),
    };
  });

  // 1. Copia local de los artículos (los que ya no vienen quedan como no vigentes)
  for (let i = 0; i < rows.length; i += 200) {
    const chunk = rows.slice(i, i + 200);
    await db
      .insert(effiArticles)
      .values(chunk)
      .onDuplicateKeyUpdate({
        set: {
          nombre: sql`values(${effiArticles.nombre})`,
          referencia: sql`values(${effiArticles.referencia})`,
          categoriaId: sql`values(${effiArticles.categoriaId})`,
          categoriaNombre: sql`values(${effiArticles.categoriaNombre})`,
          precio: sql`values(${effiArticles.precio})`,
          precioEspecial: sql`values(${effiArticles.precioEspecial})`,
          gestionStock: sql`values(${effiArticles.gestionStock})`,
          stock: sql`values(${effiArticles.stock})`,
          stockMinimo: sql`values(${effiArticles.stockMinimo})`,
          costo: sql`values(${effiArticles.costo})`,
          tipoArticulo: sql`values(${effiArticles.tipoArticulo})`,
          vigente: sql`values(${effiArticles.vigente})`,
          syncedAt: sql`values(${effiArticles.syncedAt})`,
        },
      });
  }
  const seen = new Set(rows.map((r) => r.id));
  const stale = (await db.select({ id: effiArticles.id }).from(effiArticles)).filter((r) => !seen.has(r.id)).map((r) => r.id);
  if (stale.length) await db.update(effiArticles).set({ vigente: false }).where(inArray(effiArticles.id, stale));

  // 2. Productos de la tienda: los artículos vendibles que no están en ningún producto se agrupan solos
  const sellable = rows.filter((r) => r.vigente && r.tipoArticulo !== 4);
  const sellableIds = new Set(sellable.map((r) => r.id));
  const options = await db.select().from(productOptions);
  const linked = new Set(options.map((o) => o.effiArticleId));
  const existing = await db.select({ id: products.id, groupKey: products.groupKey, slug: products.slug }).from(products);
  const byKey = new Map(existing.map((p) => [p.groupKey, p.id]));
  const slugs = new Set(existing.map((p) => p.slug));
  const optionCount = new Map<number, number>();
  for (const o of options) optionCount.set(o.productId, (optionCount.get(o.productId) ?? 0) + 1);

  let created = 0;
  let added = 0;
  const pending = sellable.filter((r) => !linked.has(r.id)).sort((a, b) => a.id - b.id);
  for (const article of pending) {
    const key = groupKeyOf(article.categoriaId, article.nombre);
    let productId = byKey.get(key);
    if (!productId) {
      const { display } = splitPresentation(article.nombre);
      const name = titleCase(display).slice(0, 160);
      let slug = slugify(name) || `producto-${article.id}`;
      for (let n = 2; slugs.has(slug); n++) slug = `${slugify(name)}-${n}`;
      slugs.add(slug);
      const mapped = article.categoriaId ? effiCategoryMap[article.categoriaId] : undefined;
      const [res] = await db
        .insert(products)
        .values({
          slug,
          groupKey: key,
          name,
          category: mapped?.category ?? null,
          subcategory: mapped?.subcategory ?? null,
          navidad: mapped?.navidad ?? false,
          description: "",
          // Sin categoría de tienda conocida: queda oculto hasta que se revise
          visible: Boolean(mapped),
        })
        .$returningId();
      productId = res.id;
      byKey.set(key, productId);
      created++;
    }
    const { label } = splitPresentation(article.nombre);
    const position = optionCount.get(productId) ?? 0;
    optionCount.set(productId, position + 1);
    await db.insert(productOptions).values({
      productId,
      effiArticleId: article.id,
      label: (label ?? "Única").slice(0, 80),
      position,
    });
    added++;
  }

  // 3. Presentaciones cuyos artículos ya no se venden en Effi: fuera; productos vacíos: fuera
  const gone = options.filter((o) => !sellableIds.has(o.effiArticleId)).map((o) => o.id);
  if (gone.length) await db.delete(productOptions).where(inArray(productOptions.id, gone));
  const emptyProducts = await db.execute(
    sql`select p.id from products p left join product_options o on o.product_id = p.id where o.id is null`,
  );
  const emptyIds = (emptyProducts[0] as unknown as { id: number }[]).map((r) => r.id);
  let removedFiles: string[] = [];
  if (emptyIds.length) {
    removedFiles = (await db.select({ file: productImages.file }).from(productImages).where(inArray(productImages.productId, emptyIds))).map((i) => i.file);
    await db.delete(products).where(inArray(products.id, emptyIds));
  }

  // 4. Categoría de la tienda según la de Effi (Effi manda) y orden de presentaciones por tamaño
  if (added) await reorderNewOptions(db);
  const catRows = await db
    .select({ productId: productOptions.productId, categoriaId: effiArticles.categoriaId })
    .from(productOptions)
    .innerJoin(effiArticles, eq(effiArticles.id, productOptions.effiArticleId));
  const catByProduct = new Map<number, number | null>();
  for (const r of catRows) if (!catByProduct.has(r.productId)) catByProduct.set(r.productId, r.categoriaId);
  for (const [productId, categoriaId] of catByProduct) {
    const mapped = categoriaId ? effiCategoryMap[categoriaId] : undefined;
    await db
      .update(products)
      .set({ category: mapped?.category ?? null, subcategory: mapped?.subcategory ?? null })
      .where(eq(products.id, productId));
  }

  const result = {
    ok: true,
    at: new Date().toISOString(),
    detalle: `${rows.length} artículos de Effi · ${created} productos nuevos · ${added} presentaciones nuevas · ${gone.length} retiradas`,
  };
  await setState(db, "articles", result);
  return { ...result, removedFiles };
}

/** Ordena por tamaño las presentaciones de cada producto (30 ml, 60 ml, 125 ml…), respetando las "Única" al final. */
async function reorderNewOptions(db: Db) {
  const all = await db.select().from(productOptions);
  const byProduct = Map.groupBy(all, (o) => o.productId);
  for (const list of byProduct.values()) {
    if (list.length < 2) continue;
    const sorted = [...list].sort((a, b) => sizeOrder(a.label) - sizeOrder(b.label) || a.effiArticleId - b.effiArticleId);
    // Etiquetas repetidas (p. ej. artículos duplicados en Effi): se distinguen con su id
    const seenLabels = new Map<string, number>();
    for (const [position, o] of sorted.entries()) {
      const times = (seenLabels.get(o.label) ?? 0) + 1;
      seenLabels.set(o.label, times);
      const label = times > 1 ? `${o.label} · #${o.effiArticleId}` : o.label;
      if (o.position !== position || label !== o.label) {
        await db.update(productOptions).set({ position, label }).where(eq(productOptions.id, o.id));
      }
    }
  }
}

// ─── Ventas (remisiones) ───

type EffiRemision = {
  sucursal: string;
  id: string;
  id_transaccion: string;
  fecha_trans: string;
  total: string;
  nombre_cliente: string | null;
  nombre_ciudad: string | null;
  ecommerce: string | null;
  vigente: string;
};

const ymd = (d: Date) => d.toISOString().slice(0, 10);

/** Trae las remisiones nuevas (desde la última guardada, con 3 días de margen; la primera vez, 13 meses). */
export async function syncSales(db: Db) {
  const [{ last }] = await db.select({ last: max(effiSales.fecha) }).from(effiSales);
  const from = last ? new Date(new Date(last).getTime() - 3 * 86_400_000) : new Date(Date.now() - 395 * 86_400_000);
  const raw = await effiGetAll<EffiRemision>("remision_v", { desde: ymd(from) });
  const rows = raw.map((r) => ({
    sucursal: Number(r.sucursal),
    id: Number(r.id),
    idTransaccion: r.id_transaccion,
    fecha: new Date(`${r.fecha_trans.replace(" ", "T")}Z`),
    total: Math.round(Number(r.total)),
    cliente: r.nombre_cliente?.slice(0, 160) ?? null,
    ciudad: r.nombre_ciudad?.slice(0, 80) ?? null,
    ecommerce: Boolean(r.ecommerce),
    vigente: r.vigente === "1",
  }));
  for (let i = 0; i < rows.length; i += 200) {
    await db
      .insert(effiSales)
      .values(rows.slice(i, i + 200))
      .onDuplicateKeyUpdate({
        set: {
          total: sql`values(${effiSales.total})`,
          cliente: sql`values(${effiSales.cliente})`,
          ciudad: sql`values(${effiSales.ciudad})`,
          vigente: sql`values(${effiSales.vigente})`,
        },
      });
  }
  const result = { ok: true, at: new Date().toISOString(), detalle: `${rows.length} remisiones revisadas desde ${ymd(from)}` };
  await setState(db, "sales", result);
  return result;
}

/** Corre las dos sincronizaciones; guarda el error si alguna falla (el panel lo muestra). */
export async function syncAll(db: Db) {
  const out: { articles?: SyncResult & { removedFiles?: string[] }; sales?: SyncResult } = {};
  for (const [key, fn] of [
    ["articles", syncArticles],
    ["sales", syncSales],
  ] as const) {
    try {
      out[key] = await fn(db);
    } catch (e) {
      const result = { ok: false, at: new Date().toISOString(), error: e instanceof Error ? e.message : String(e) };
      await setState(db, key, result).catch(() => {});
      out[key] = result;
    }
  }
  return out;
}

/** Ventas desde una fecha (para estadísticas). */
export const salesSince = (db: Db, since: Date) =>
  db
    .select()
    .from(effiSales)
    .where(and(gte(effiSales.fecha, since), eq(effiSales.vigente, true)));
