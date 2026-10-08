"use server";

import { and, eq, inArray, ne, notInArray } from "drizzle-orm";
import { updateTag } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { categories } from "@/data/catalog";
import { verifyPassword } from "@/lib/auth/password";
import { endSession, requireAdmin, startSession } from "@/lib/auth/session";
import { CATALOG_TAG } from "@/lib/catalog/queries";
import { db, schema } from "@/lib/db";
import { slugify } from "@/lib/slug";
import { deleteImage, FILE_PATTERN, ImageError, mediaUrl, saveImage } from "@/lib/storage";

// ─── Login ───

// Freno a la fuerza bruta: 5 intentos fallidos por IP cada 15 minutos (un solo proceso Node).
const attempts = new Map<string, { count: number; until: number }>();
const WINDOW = 15 * 60 * 1000;

export type LoginState = { error?: string };

export async function login(_prev: LoginState, form: FormData): Promise<LoginState> {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const now = Date.now();
  const record = attempts.get(ip);
  if (record && record.until > now && record.count >= 5) {
    return { error: "Demasiados intentos. Espera 15 minutos e inténtalo de nuevo." };
  }

  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const [user] = email ? await db.select().from(schema.adminUsers).where(eq(schema.adminUsers.email, email)) : [];
  const ok = user ? await verifyPassword(password, user.passwordHash) : false;

  if (!user || !ok) {
    const fresh = !record || record.until <= now;
    attempts.set(ip, { count: fresh ? 1 : record.count + 1, until: fresh ? now + WINDOW : record.until });
    return { error: "Correo o contraseña incorrectos." };
  }

  attempts.delete(ip);
  await startSession(user);
  redirect("/admin");
}

export async function logout() {
  await endSession();
  redirect("/admin/ingresar");
}

// ─── Fotos ───

export type UploadResult = { ok: true; file: string; url: string; width: number; height: number } | { ok: false; error: string };

/** Sube una foto apenas se elige; se asocia al producto al guardar el formulario. */
export async function uploadProductImage(form: FormData): Promise<UploadResult> {
  await requireAdmin();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "No llegó ninguna foto." };
  try {
    const saved = await saveImage(file, String(form.get("name") || "producto"));
    return { ok: true, ...saved, url: mediaUrl(saved.file) };
  } catch (e) {
    return { ok: false, error: e instanceof ImageError ? e.message : `No se pudo procesar "${file.name}".` };
  }
}

// ─── Productos ───

const subcategorySlugs = new Map(categories.map((c) => [c.slug, c.subcategories.map((s) => s.slug)]));

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Máximo ${max} caracteres.`)
    .transform((v) => v || null);

const money = z.number({ error: "Escribe un precio." }).int("Sin decimales.").min(0).max(100_000_000);

const productInput = z
  .object({
    id: z.number().int().positive().nullable(),
    name: z.string().trim().min(2, "Escribe el nombre del producto.").max(160),
    category: z.string().refine((c) => subcategorySlugs.has(c), "Elige una categoría."),
    subcategory: z.string().nullable(),
    description: z.string().trim().max(5000, "La descripción es muy larga."),
    warning: optionalText(160),
    badge: optionalText(40),
    personalization: optionalText(80),
    visible: z.boolean(),
    featured: z.boolean(),
    navidad: z.boolean(),
    options: z
      .array(
        z.object({
          id: z.number().int().positive().nullable(),
          name: z.string().trim().min(1, "Cada presentación necesita un nombre.").max(80),
          price: money.min(100, "Cada presentación necesita un precio."),
          compareAtPrice: money.nullable(),
          stock: z.number().int("Unidades sin decimales.").min(-9999).max(999_999).nullable(),
          soldOut: z.boolean(),
        }),
      )
      .min(1, "Agrega al menos una presentación.")
      .max(40),
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
    const subs = subcategorySlugs.get(p.category) ?? [];
    if (p.subcategory && !subs.includes(p.subcategory)) {
      ctx.addIssue({ code: "custom", message: "La subcategoría no corresponde a la categoría.", path: ["subcategory"] });
    }
    p.options.forEach((o, i) => {
      if (o.compareAtPrice !== null && o.compareAtPrice <= o.price) {
        ctx.addIssue({
          code: "custom",
          message: `"${o.name}": el precio anterior debe ser mayor que el precio actual.`,
          path: ["options", i, "compareAtPrice"],
        });
      }
    });
  });

export type ProductInput = z.input<typeof productInput>;
export type SaveState = { error?: string };

async function uniqueSlug(name: string, exceptId: number | null) {
  const base = slugify(name) || "producto";
  for (let i = 1; ; i++) {
    const slug = i === 1 ? base : `${base}-${i}`;
    const [taken] = await db
      .select({ id: schema.products.id })
      .from(schema.products)
      .where(exceptId ? and(eq(schema.products.slug, slug), ne(schema.products.id, exceptId)) : eq(schema.products.slug, slug));
    if (!taken) return slug;
  }
}

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

  const fields = {
    name: p.name,
    category: p.category,
    subcategory: p.subcategory || null,
    description: p.description,
    warning: p.warning,
    badge: p.badge,
    personalization: p.personalization,
    visible: p.visible,
    featured: p.featured,
    navidad: p.navidad,
  };

  let removedFiles: string[] = [];
  const productId = await db.transaction(async (tx) => {
    let id = p.id;
    if (id) {
      const [exists] = await tx.select({ id: schema.products.id }).from(schema.products).where(eq(schema.products.id, id));
      if (!exists) throw new Error("not-found");
      await tx.update(schema.products).set(fields).where(eq(schema.products.id, id));
    } else {
      // El slug se fija al crear: cambiar el nombre después no rompe los links ya compartidos
      const [res] = await tx.insert(schema.products).values({ ...fields, slug: await uniqueSlug(p.name, null) }).$returningId();
      id = res.id;
    }

    // Presentaciones: actualizar las que siguen, crear las nuevas, borrar las quitadas
    const keepOptions = p.options.flatMap((o) => (o.id ? [o.id] : []));
    await tx
      .delete(schema.productOptions)
      .where(
        keepOptions.length
          ? and(eq(schema.productOptions.productId, id), notInArray(schema.productOptions.id, keepOptions))
          : eq(schema.productOptions.productId, id),
      );
    for (const [position, o] of p.options.entries()) {
      const values = { name: o.name, price: o.price, compareAtPrice: o.compareAtPrice, stock: o.stock, soldOut: o.soldOut, position };
      if (o.id) {
        await tx
          .update(schema.productOptions)
          .set(values)
          .where(and(eq(schema.productOptions.id, o.id), eq(schema.productOptions.productId, id)));
      } else {
        await tx.insert(schema.productOptions).values({ ...values, productId: id });
      }
    }

    // Fotos: igual; los archivos quitados se borran del disco después de confirmar
    const current = await tx.select().from(schema.productImages).where(eq(schema.productImages.productId, id));
    const keepImages = new Set(p.images.flatMap((i) => (i.id ? [i.id] : [])));
    const removed = current.filter((i) => !keepImages.has(i.id));
    if (removed.length) {
      await tx.delete(schema.productImages).where(inArray(schema.productImages.id, removed.map((i) => i.id)));
      removedFiles = removed.map((i) => i.file);
    }
    for (const [position, img] of p.images.entries()) {
      if (img.id && keepImages.has(img.id)) {
        await tx
          .update(schema.productImages)
          .set({ alt: img.alt, position })
          .where(and(eq(schema.productImages.id, img.id), eq(schema.productImages.productId, id)));
      } else {
        await tx.insert(schema.productImages).values({ productId: id, file: img.file, alt: img.alt, width: img.width, height: img.height, position });
      }
    }
    return id;
  }).catch((e: unknown) => {
    if (e instanceof Error && e.message === "not-found") return null;
    throw e;
  });

  if (!productId) return { error: "Este producto ya no existe." };
  await Promise.all(removedFiles.map(deleteImage));
  updateTag(CATALOG_TAG);

  // Recarga la ficha con los ids nuevos (presentaciones y fotos) y el aviso de guardado
  redirect(`/admin/productos/${productId}?${p.id ? "guardado" : "nuevo"}=1`);
}

export async function deleteProduct(form: FormData) {
  await requireAdmin();
  const id = Number(form.get("id"));
  if (!Number.isInteger(id) || id <= 0) return;
  // TODO(fase 6): cuando existan pedidos, solo se podrá eliminar si nunca se vendió; si no, ocultar.
  const images = await db.select({ file: schema.productImages.file }).from(schema.productImages).where(eq(schema.productImages.productId, id));
  await db.delete(schema.products).where(eq(schema.products.id, id));
  await Promise.all(images.map((i) => deleteImage(i.file)));
  updateTag(CATALOG_TAG);
  redirect("/admin/productos?eliminado=1");
}
