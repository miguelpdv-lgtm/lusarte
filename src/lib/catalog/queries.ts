import "server-only";
import { asc, eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { db, schema } from "@/lib/db";
import { mediaUrl } from "@/lib/storage";
import type { Product } from "./types";

/** Etiqueta de caché del catálogo: el panel la invalida al guardar (updateTag). */
export const CATALOG_TAG = "catalogo";

/** Carga productos con sus presentaciones e imágenes. `onlyVisible` para la tienda. */
export async function loadProducts({ onlyVisible }: { onlyVisible: boolean }): Promise<(Product & { visible: boolean })[]> {
  const base = db.select().from(schema.products);
  const [rows, options, images] = await Promise.all([
    onlyVisible ? base.where(eq(schema.products.visible, true)) : base,
    db.select().from(schema.productOptions).orderBy(asc(schema.productOptions.position), asc(schema.productOptions.id)),
    db.select().from(schema.productImages).orderBy(asc(schema.productImages.position), asc(schema.productImages.id)),
  ]);

  const optionsBy = Map.groupBy(options, (o) => o.productId);
  const imagesBy = Map.groupBy(images, (i) => i.productId);

  return rows.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    category: p.category,
    subcategory: p.subcategory,
    description: p.description,
    warning: p.warning,
    badge: p.badge,
    personalization: p.personalization,
    featured: p.featured,
    navidad: p.navidad,
    visible: p.visible,
    position: p.position,
    createdAt: p.createdAt.getTime(),
    options: (optionsBy.get(p.id) ?? []).map((o) => ({
      id: o.id,
      name: o.name,
      price: o.price,
      compareAtPrice: o.compareAtPrice,
      stock: o.stock,
      soldOut: o.soldOut,
    })),
    images: (imagesBy.get(p.id) ?? []).map((i) => ({
      id: i.id,
      url: mediaUrl(i.file),
      alt: i.alt,
      width: i.width,
      height: i.height,
    })),
  }));
}

/** Catálogo público (solo visibles y con al menos una presentación), en caché hasta que el panel guarde. */
export const getCatalog = unstable_cache(
  async () => (await loadProducts({ onlyVisible: true })).filter((p) => p.options.length > 0),
  ["catalogo-publico"],
  { tags: [CATALOG_TAG], revalidate: 3600 },
);

export async function getProduct(slug: string) {
  return (await getCatalog()).find((p) => p.slug === slug) ?? null;
}
