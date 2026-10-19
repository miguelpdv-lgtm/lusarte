import "server-only";
import { asc, eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { db, schema } from "@/lib/db";
import { mediaUrl } from "@/lib/storage";
import type { AdminProduct, Product } from "./types";

/** Etiqueta de caché del catálogo: se invalida al guardar en el panel y al sincronizar con Effi. */
export const CATALOG_TAG = "catalogo";

/**
 * Productos de la tienda con sus presentaciones (precio y stock de Effi) e imágenes.
 * Es la vista completa del panel; la tienda filtra sobre ella.
 */
export async function loadProducts(): Promise<AdminProduct[]> {
  const [rows, options, images] = await Promise.all([
    db.select().from(schema.products),
    db
      .select({ option: schema.productOptions, article: schema.effiArticles })
      .from(schema.productOptions)
      .innerJoin(schema.effiArticles, eq(schema.effiArticles.id, schema.productOptions.effiArticleId))
      .orderBy(asc(schema.productOptions.position), asc(schema.productOptions.id)),
    db.select().from(schema.productImages).orderBy(asc(schema.productImages.position), asc(schema.productImages.id)),
  ]);

  const optionsBy = Map.groupBy(options, (o) => o.option.productId);
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
    options: (optionsBy.get(p.id) ?? []).map(({ option: o, article: a }) => ({
      id: o.id,
      name: o.label,
      price: a.precio,
      compareAtPrice: o.compareAtPrice,
      // Sin trazabilidad o sin control de stock: se vende sin límite
      stock: a.gestionStock <= 1 ? null : Math.max(0, a.stock),
      soldOut: !a.vigente,
      hidden: o.hidden,
      effiArticleId: a.id,
      effiName: a.nombre,
      referencia: a.referencia,
      precioEspecial: a.precioEspecial,
      stockMinimo: a.stockMinimo,
      gestionStock: a.gestionStock,
      costo: a.costo,
      categoriaId: a.categoriaId,
    })),
    effiCategoryId: optionsBy.get(p.id)?.[0]?.article.categoriaId ?? null,
    images: (imagesBy.get(p.id) ?? []).map((i) => ({
      id: i.id,
      url: mediaUrl(i.file),
      alt: i.alt,
      width: i.width,
      height: i.height,
    })),
  }));
}

/** Filtro de la tienda: visibles, con categoría de tienda y con al menos una presentación a la venta. */
export function toPublicCatalog(list: AdminProduct[]): Product[] {
  return list.flatMap((p) => {
    const options = p.options.filter((o) => !o.hidden && o.price > 0);
    if (!p.visible || !p.category || options.length === 0) return [];
    return [
      {
        ...p,
        category: p.category,
        options: options.map(({ id, name, price, compareAtPrice, stock, soldOut }) => ({ id, name, price, compareAtPrice, stock, soldOut })),
      },
    ];
  });
}

/** Catálogo público (en caché). Para cobrar se usa loadProducts() directo: precios y stock sin caché. */
export const getCatalog = unstable_cache(async (): Promise<Product[]> => toPublicCatalog(await loadProducts()), ["catalogo-publico"], {
  tags: [CATALOG_TAG],
  revalidate: 300,
});

export async function getProduct(slug: string) {
  return (await getCatalog()).find((p) => p.slug === slug) ?? null;
}
