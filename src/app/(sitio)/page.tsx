import { syncEffiIfStale } from "@/lib/effi/auto";
import { Categories } from "@/components/home/Categories";
import { Faq } from "@/components/home/Faq";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { Hero } from "@/components/home/Hero";
import { SeasonBanner } from "@/components/home/SeasonBanner";
import { StepsGuide } from "@/components/home/StepsGuide";
import { getCatalog } from "@/lib/catalog/queries";
import type { Metadata } from "next";
import { isProductAvailable, type Product } from "@/lib/catalog/types";
import { site } from "@/lib/site";

// El catálogo vive en la base: se lee al pedir la página (con caché), no al compilar.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { alternates: { canonical: "/" } };

// Datos estructurados de la tienda (Google): la organización y el buscador del sitio
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "OnlineStore",
      "@id": `${site.url}/#tienda`,
      name: site.name,
      slogan: site.tagline,
      description: site.description,
      url: site.url,
      logo: `${site.url}/email/logo.png`,
      image: `${site.url}/opengraph-image.jpg`,
      telephone: `+${site.whatsapp}`,
      areaServed: { "@type": "Country", name: "Colombia" },
      address: { "@type": "PostalAddress", addressLocality: "Barranquilla", addressRegion: "Atlántico", addressCountry: "CO" },
      sameAs: [`https://instagram.com/${site.instagram}`],
      contactPoint: { "@type": "ContactPoint", telephone: `+${site.whatsapp}`, contactType: "customer service", availableLanguage: "es" },
    },
    {
      "@type": "WebSite",
      "@id": `${site.url}/#web`,
      name: site.name,
      url: site.url,
      inLanguage: "es-CO",
      publisher: { "@id": `${site.url}/#tienda` },
      potentialAction: { "@type": "SearchAction", target: `${site.url}/tienda?q={search_term_string}`, "query-input": "required name=search_term_string" },
    },
  ],
};

export default async function Home() {
  syncEffiIfStale();
  // Si la base no responde (p. ej. recién creada y vacía), el inicio igual carga sin destacados:
  // el hosting revisa esta página para saber si la app está viva.
  const catalog: Product[] = await getCatalog().catch((error: unknown) => {
    console.error("No se pudo leer el catálogo para el inicio:", error);
    return [];
  });
  // Destacados elegidos en el panel; si no alcanzan, productos disponibles con foto y, por último,
  // disponibles de categorías distintas (para que la sección nunca quede vacía)
  const available = catalog.filter(isProductAvailable);
  const picked: Product[] = [];
  const add = (list: Product[]) => {
    for (const p of list) if (picked.length < 4 && !picked.includes(p)) picked.push(p);
  };
  add(available.filter((p) => p.featured));
  add(available.filter((p) => p.images.length > 0));
  add([...Map.groupBy(available, (p) => p.category).values()].map((list) => list[0]));
  const products = picked;

  return (
    <>
      <Hero />
      <Categories />
      <SeasonBanner />
      <FeaturedProducts products={products} />
      <StepsGuide />
      <Faq />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </>
  );
}
