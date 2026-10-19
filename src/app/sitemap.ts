import type { MetadataRoute } from "next";
import { categories, categoryHref, navidad, subcategoryHref } from "@/data/catalog";
import { getCatalog } from "@/lib/catalog/queries";
import { site } from "@/lib/site";

// Mapa del sitio para Google: páginas fijas, categorías, colección y cada producto a la venta (con su foto).
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const url = (path: string) => new URL(path, site.url).toString();
  const now = new Date();

  const pages: MetadataRoute.Sitemap = [
    { url: url("/"), lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: url("/tienda"), lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: url(navidad.href), lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    ...categories.flatMap((c) => [
      { url: url(categoryHref(c)), lastModified: now, changeFrequency: "daily" as const, priority: 0.8 },
      ...c.subcategories.map((s) => ({ url: url(subcategoryHref(c, s)), lastModified: now, changeFrequency: "weekly" as const, priority: 0.6 })),
    ]),
    ...["/como-comprar", "/envios-y-devoluciones", "/preguntas-frecuentes", "/contacto"].map((p) => ({
      url: url(p),
      changeFrequency: "monthly" as const,
      priority: 0.4,
    })),
    ...["/terminos", "/privacidad"].map((p) => ({ url: url(p), changeFrequency: "yearly" as const, priority: 0.2 })),
  ];

  // Si la base no responde, al menos las páginas fijas
  const catalog = await getCatalog().catch(() => []);
  const products: MetadataRoute.Sitemap = catalog.map((p) => ({
    url: url(`/producto/${p.slug}`),
    lastModified: new Date(p.createdAt),
    changeFrequency: "weekly",
    priority: 0.7,
    ...(p.images.length ? { images: p.images.map((i) => url(i.url)) } : {}),
  }));

  return [...pages, ...products];
}
