import { Categories } from "@/components/home/Categories";
import { Faq } from "@/components/home/Faq";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { Hero } from "@/components/home/Hero";
import { SeasonBanner } from "@/components/home/SeasonBanner";
import { StepsGuide } from "@/components/home/StepsGuide";
import { Story } from "@/components/home/Story";
import { getCatalog } from "@/lib/catalog/queries";
import { isProductAvailable } from "@/lib/catalog/types";

// El catálogo vive en la base: se lee al pedir la página (con caché), no al compilar.
export const dynamic = "force-dynamic";

export default async function Home() {
  const catalog = await getCatalog();
  // Destacados elegidos en el panel; si no hay suficientes, se completa con productos disponibles con foto
  const featured = catalog.filter((p) => p.featured && isProductAvailable(p));
  const extra = catalog.filter((p) => !p.featured && isProductAvailable(p) && p.images.length > 0);
  const products = [...featured, ...extra].slice(0, 4);

  return (
    <>
      <Hero />
      <Categories />
      <SeasonBanner />
      <FeaturedProducts products={products} />
      <Story />
      <StepsGuide />
      <Faq />
    </>
  );
}
