"use server";

import { and, eq, inArray, ne } from "drizzle-orm";
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { effiCategoryMap } from "@/data/catalog";
import { requireAdmin } from "@/lib/auth/session";
import { CATALOG_TAG, loadProducts } from "@/lib/catalog/queries";
import { db, schema } from "@/lib/db";
import { adjustEffiStock, annulEffiArticle, createEffiArticle, updateEffiArticle, type ArticlePatch } from "@/lib/effi/articles";
import { groupKeyOf, splitPresentation, titleCase } from "@/lib/effi/grouping";
import { slugify } from "@/lib/slug";
import { deleteImage, FILE_PATTERN } from "@/lib/storage";

// Productos: lo que existe en Effi se cambia primero en Effi (fuente de verdad) y luego en la copia local;
// fotos, visibilidad y demás capa web solo viven aquí.

const effiMessage = (e: unknown) => `Effi no aceptó el cambio: ${e instanceof Error ? e.message : String(e)}`;

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Máximo ${max} caracteres.`)
    .transform((v) => v || null);

const money = z.number({ error: "Escribe un precio." }).int("Sin decimales.").min(0).max(100_000_000);

async function uniqueSlug(name: string) {
  const base = slugify(name) || "producto";
  for (let n = 1; ; n++) {
    const slug = n === 1 ? base : `${base}-${n}`;
    const [taken] = await db.select({ id: schema.products.id }).from(schema.products).where(eq(schema.products.slug, slug));
    if (!taken) return slug;
  }
}

const mappedCategory = (categoriaId: number | null) => (categoriaId ? effiCategoryMap[categoriaId] : undefined);

// ─── Guardar ───

const productInput = z
  .object({
    id: z.number().int().positive(),
    name: z.string().trim().min(2, "Escribe el nombre del producto.").max(160),
    effiCategoryId: z.number().int().positive().nullable(),
    description: z.string().trim().max(2000, "La descripción es muy larga (máximo 2.000 caracteres, el límite de Effi)."),
    warning: optionalText(160),
    badge: optionalText(40),
    personalization: optionalText(80),
    visible: z.boolean(),
    featured: z.boolean(),
    navidad: z.boolean(),
    options: z.array(
      z.object({
        id: z.number().int().positive(),
        label: z.string().trim().min(1, "Cada presentación necesita un nombre en la web.").max(80),
        effiName: z.string().trim().min(2, "Cada presentación necesita un nombre en Effi.").max(120, "El nombre en Effi admite máximo 120 caracteres."),
        referencia: optionalText(40),
        price: money.min(100, "Cada presentación necesita un precio."),
        precioEspecial: money,
        compareAtPrice: money.nullable(),
        stockMinimo: z.number().int().min(0).max(999_999),
        hidden: z.boolean(),
      }),
    ),
    images: z
      .array(
        z.object({
          id: z.number().int().positive().nullable(),
          file: z.string().regex(FILE_PATTERN),
          alt: z.string().trim().min(3, "Describe cada foto (texto alternativo).").max(200),
          width: z.number().int().positive(),
          height: z.number().int().positive(),
        }),
      )
      .max(12, "Máximo 12 fotos por producto."),
  })
  .superRefine((p, ctx) => {
    p.options.forEach((o, i) => {
      if (o.compareAtPrice !== null && o.compareAtPrice <= o.price) {
        ctx.addIssue({ code: "custom", message: `"${o.label}": el precio anterior debe ser mayor que el precio actual.`, path: ["options", i] });
      }
    });
  });

export type ProductInput = z.input<typeof productInput>;
export type SaveState = { error?: string };

export async function saveProduct(_prev: SaveState, form: FormData): Promise<SaveState> {
  await requireAdmin();
  let raw: unknown;
  try {
    raw = JSON.parse(String(form.get("payload")));
  } catch {
    return { error: "No se pudo leer el formulario. Recarga la página e inténtalo de nuevo." };
  }
  const parsed = productInput.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa los datos del producto." };
  const p = parsed.data;

  const current = (await loadProducts()).find((x) => x.id === p.id);
  if (!current) return { error: "Este producto ya no existe (puede que lo hayan retirado en Effi)." };
  const currentOptions = new Map(current.options.map((o) => [o.id, o]));
  if (p.options.length !== current.options.length || p.options.some((o) => !currentOptions.has(o.id))) {
    return { error: "Las presentaciones cambiaron mientras editabas (sincronización con Effi). Recarga la página." };
  }

  // 1. Effi: solo lo que cambió, artículo por artículo
  const descriptionChanged = p.description !== current.description;
  const categoryChanged = p.effiCategoryId !== current.effiCategoryId && p.effiCategoryId !== null;
  try {
    for (const o of p.options) {
      const before = currentOptions.get(o.id)!;
      const patch: ArticlePatch = {};
      if (o.effiName !== before.effiName) patch.nombre = o.effiName;
      if (o.referencia !== before.referencia) patch.referencia = o.referencia;
      if (o.price !== before.price) patch.precio = o.price;
      if (o.precioEspecial !== before.precioEspecial) patch.precioEspecial = o.precioEspecial;
      if (o.stockMinimo !== before.stockMinimo && before.gestionStock > 0) patch.stockMinimo = o.stockMinimo;
      if (descriptionChanged) patch.descripcionDetallada = p.description;
      if (categoryChanged) patch.categoriaId = p.effiCategoryId;
      if (Object.keys(patch).length) await updateEffiArticle(before.effiArticleId, patch);
    }
  } catch (e) {
    return { error: effiMessage(e) };
  }

  // 2. Capa web
  const mapped = mappedCategory(categoryChanged ? p.effiCategoryId : current.effiCategoryId);
  let removedFiles: string[] = [];
  await db.transaction(async (tx) => {
    await tx
      .update(schema.products)
      .set({
        name: p.name,
        description: p.description,
        warning: p.warning,
        badge: p.badge,
        personalization: p.personalization,
        visible: p.visible,
        featured: p.featured,
        navidad: p.navidad,
        ...(categoryChanged && { category: mapped?.category ?? null, subcategory: mapped?.subcategory ?? null }),
      })
      .where(eq(schema.products.id, p.id));

    for (const [position, o] of p.options.entries()) {
      await tx
        .update(schema.productOptions)
        .set({ label: o.label, compareAtPrice: o.compareAtPrice, hidden: o.hidden, position })
        .where(and(eq(schema.productOptions.id, o.id), eq(schema.productOptions.productId, p.id)));
    }

    const currentImages = await tx.select().from(schema.productImages).where(eq(schema.productImages.productId, p.id));
    const keep = new Set(p.images.flatMap((i) => (i.id ? [i.id] : [])));
    const removed = currentImages.filter((i) => !keep.has(i.id));
    if (removed.length) {
      await tx.delete(schema.productImages).where(inArray(schema.productImages.id, removed.map((i) => i.id)));
      removedFiles = removed.map((i) => i.file);
    }
    for (const [position, img] of p.images.entries()) {
      if (img.id && keep.has(img.id)) {
        await tx
          .update(schema.productImages)
          .set({ alt: img.alt, position })
          .where(and(eq(schema.productImages.id, img.id), eq(schema.productImages.productId, p.id)));
      } else {
        await tx.insert(schema.productImages).values({ productId: p.id, file: img.file, alt: img.alt, width: img.width, height: img.height, position });
      }
    }
  });

  await Promise.all(removedFiles.map(deleteImage));
  updateTag(CATALOG_TAG);
  redirect(`/admin/productos/${p.id}?guardado=1`);
}

// ─── Crear producto / agregar presentación (se crean en Effi) ───

const presentationInput = z.object({
  label: z.string().trim().max(60),
  referencia: optionalText(40),
  price: money.min(100, "Cada presentación necesita un precio."),
  precioEspecial: money,
  controlStock: z.boolean(),
  stockInicial: z.number().int().min(0).max(999_999),
  costo: money,
  stockMinimo: z.number().int().min(0).max(999_999),
});

const newProductInput = z
  .object({
    name: z.string().trim().min(2, "Escribe el nombre del producto.").max(100),
    effiCategoryId: z.number({ error: "Elige la categoría de Effi." }).int().positive(),
    description: z.string().trim().max(2000),
    presentations: z.array(presentationInput).min(1, "Agrega al menos una presentación.").max(12),
  })
  .superRefine((p, ctx) => {
    p.presentations.forEach((o, i) => {
      if (o.controlStock && o.stockInicial > 0 && o.costo <= 0) {
        ctx.addIssue({ code: "custom", message: "Para cargar stock inicial, Effi necesita el costo unitario.", path: ["presentations", i] });
      }
      if (p.presentations.length > 1 && !o.label) {
        ctx.addIssue({ code: "custom", message: "Con varias presentaciones, cada una necesita su nombre (30 ml, 60 ml…).", path: ["presentations", i] });
      }
    });
  });

export type NewProductInput = z.input<typeof newProductInput>;
export type CreateState = { error?: string };

/** Nombre del artículo en Effi: "FRAGANCIA CHINOLA 30 ML" (el estilo del catálogo de Effi). */
const effiArticleName = (name: string, label: string) => `${name} ${label}`.trim().toUpperCase().slice(0, 120);

async function createPresentation(name: string, categoriaId: number | null, description: string, o: z.infer<typeof presentationInput>) {
  const article = await createEffiArticle({
    nombre: effiArticleName(name, o.label),
    referencia: o.referencia,
    categoriaId,
    precio: o.price,
    precioEspecial: o.precioEspecial,
    stockMinimo: o.stockMinimo,
    controlStock: o.controlStock,
    descripcionDetallada: description,
  });
  if (o.controlStock && o.stockInicial > 0) await adjustEffiStock(article.id, o.stockInicial, o.costo);
  return article;
}

export async function createProduct(_prev: CreateState, form: FormData): Promise<CreateState> {
  await requireAdmin();
  let raw: unknown;
  try {
    raw = JSON.parse(String(form.get("payload")));
  } catch {
    return { error: "No se pudo leer el formulario." };
  }
  const parsed = newProductInput.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa los datos." };
  const p = parsed.data;

  const created: { id: number; label: string }[] = [];
  try {
    for (const o of p.presentations) {
      const article = await createPresentation(p.name, p.effiCategoryId, p.description, o);
      created.push({ id: article.id, label: o.label || "Única" });
    }
  } catch (e) {
    const done = created.length ? ` (${created.length} presentación(es) ya quedaron creadas en Effi: aparecerán al sincronizar)` : "";
    return { error: `${effiMessage(e)}${done}` };
  }

  const mapped = mappedCategory(p.effiCategoryId);
  const [res] = await db
    .insert(schema.products)
    .values({
      slug: await uniqueSlug(p.name),
      groupKey: groupKeyOf(p.effiCategoryId, effiArticleName(p.name, p.presentations[0].label)),
      name: titleCase(p.name),
      category: mapped?.category ?? null,
      subcategory: mapped?.subcategory ?? null,
      navidad: mapped?.navidad ?? false,
      description: p.description,
      visible: Boolean(mapped),
    })
    .$returningId();
  await db.insert(schema.productOptions).values(created.map((c, position) => ({ productId: res.id, effiArticleId: c.id, label: c.label, position })));
  updateTag(CATALOG_TAG);
  redirect(`/admin/productos/${res.id}?nuevo=1`);
}

export async function addPresentation(_prev: CreateState, form: FormData): Promise<CreateState> {
  await requireAdmin();
  const productId = Number(form.get("productId"));
  let raw: unknown;
  try {
    raw = JSON.parse(String(form.get("payload")));
  } catch {
    return { error: "No se pudo leer el formulario." };
  }
  const parsed = presentationInput.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa los datos." };
  if (!parsed.data.label) return { error: "Escribe el nombre de la presentación (30 ml, 60 ml…)." };
  if (parsed.data.controlStock && parsed.data.stockInicial > 0 && parsed.data.costo <= 0) return { error: "Para cargar stock inicial, Effi necesita el costo unitario." };

  const product = (await loadProducts()).find((x) => x.id === productId);
  if (!product) return { error: "El producto ya no existe." };
  // Nombre base del producto en Effi, sacado de su primera presentación
  const base = product.options[0] ? splitPresentation(product.options[0].effiName).display : product.name;
  try {
    const article = await createPresentation(base, product.effiCategoryId, product.description, parsed.data);
    await db.insert(schema.productOptions).values({ productId, effiArticleId: article.id, label: parsed.data.label, position: product.options.length });
  } catch (e) {
    return { error: effiMessage(e) };
  }
  updateTag(CATALOG_TAG);
  redirect(`/admin/productos/${productId}?agregada=1`);
}

// ─── Stock, anular, mover ───

export type StockState = { error?: string; ok?: string };

export async function adjustStock(_prev: StockState, form: FormData): Promise<StockState> {
  await requireAdmin();
  const optionId = Number(form.get("optionId"));
  const target = Number(form.get("stock"));
  const costo = form.get("costo") ? Number(form.get("costo")) : undefined;
  if (!Number.isInteger(target) || target < 0) return { error: "Escribe una cantidad entera (0 o más)." };
  const [row] = await db.select().from(schema.productOptions).where(eq(schema.productOptions.id, optionId));
  if (!row) return { error: "La presentación ya no existe." };
  try {
    await adjustEffiStock(row.effiArticleId, target, costo && costo > 0 ? costo : undefined);
  } catch (e) {
    return { error: effiMessage(e) };
  }
  updateTag(CATALOG_TAG);
  return { ok: `Stock actualizado en Effi: ${target}` };
}

/** Anula en Effi el artículo de una presentación y lo quita de la tienda. */
export async function annulOption(form: FormData) {
  await requireAdmin();
  const optionId = Number(form.get("optionId"));
  const [row] = await db.select().from(schema.productOptions).where(eq(schema.productOptions.id, optionId));
  if (!row) return;
  try {
    await annulEffiArticle(row.effiArticleId);
  } catch (e) {
    redirect(`/admin/productos/${row.productId}?error=${encodeURIComponent(effiMessage(e))}`);
  }
  await db.delete(schema.productOptions).where(eq(schema.productOptions.id, optionId));
  const [left] = await db.select({ id: schema.productOptions.id }).from(schema.productOptions).where(eq(schema.productOptions.productId, row.productId));
  updateTag(CATALOG_TAG);
  if (!left) {
    const files = await db.select({ file: schema.productImages.file }).from(schema.productImages).where(eq(schema.productImages.productId, row.productId));
    await db.delete(schema.products).where(eq(schema.products.id, row.productId));
    await Promise.all(files.map((f) => deleteImage(f.file)));
    redirect("/admin/productos?anulado=1");
  }
  redirect(`/admin/productos/${row.productId}?anulada=1`);
}

/**
 * Mueve una presentación a otro producto (target) o la separa en un producto propio (target vacío).
 * Solo cambia la agrupación de la web; en Effi no cambia nada.
 */
export async function moveOption(form: FormData) {
  await requireAdmin();
  const optionId = Number(form.get("optionId"));
  const target = Number(form.get("target")) || null;
  const [row] = await db
    .select({ option: schema.productOptions, article: schema.effiArticles })
    .from(schema.productOptions)
    .innerJoin(schema.effiArticles, eq(schema.effiArticles.id, schema.productOptions.effiArticleId))
    .where(eq(schema.productOptions.id, optionId));
  if (!row) return;
  const from = row.option.productId;

  let destination = target;
  if (destination) {
    const [exists] = await db.select({ id: schema.products.id }).from(schema.products).where(eq(schema.products.id, destination));
    if (!exists) return;
  } else {
    // Clave de grupo propia para que la sincronización no la vuelva a unir
    const [source] = await db.select().from(schema.products).where(eq(schema.products.id, from));
    const [res] = await db
      .insert(schema.products)
      .values({
        slug: await uniqueSlug(row.article.nombre),
        groupKey: `separado|${row.article.id}`,
        name: titleCase(splitPresentation(row.article.nombre).display).slice(0, 160),
        category: source?.category ?? null,
        subcategory: source?.subcategory ?? null,
        navidad: source?.navidad ?? false,
        description: "",
        visible: source?.visible ?? true,
      })
      .$returningId();
    destination = res.id;
  }
  if (destination === from) return;
  await db.update(schema.productOptions).set({ productId: destination, position: 999 }).where(eq(schema.productOptions.id, optionId));

  const [left] = await db.select({ id: schema.productOptions.id }).from(schema.productOptions).where(eq(schema.productOptions.productId, from));
  let redirectTo = `/admin/productos/${from}?movido=1`;
  if (!left) {
    const files = await db.select({ file: schema.productImages.file }).from(schema.productImages).where(eq(schema.productImages.productId, from));
    await db.delete(schema.products).where(and(eq(schema.products.id, from), ne(schema.products.id, destination)));
    await Promise.all(files.map((f) => deleteImage(f.file)));
    redirectTo = `/admin/productos/${destination}?movido=1`;
  }
  updateTag(CATALOG_TAG);
  redirect(redirectTo);
}
