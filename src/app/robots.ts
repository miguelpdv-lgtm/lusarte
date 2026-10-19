import type { MetadataRoute } from "next";
import { seoIndexing } from "@/lib/seo";
import { site } from "@/lib/site";

// Se lee al pedirlo: abre el sitio a buscadores solo al lanzar (src/lib/seo.ts).
export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  if (!seoIndexing()) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/", "/carrito", "/checkout", "/pedido/"],
    },
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
