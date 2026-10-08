import { ButtonLink } from "@/components/ui/ButtonLink";
import { ArrowIcon } from "@/components/ui/icons";
import { ProductCard } from "@/components/ui/ProductCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { Product } from "@/lib/catalog/types";

export function FeaturedProducts({ products }: { products: Product[] }) {
  if (!products.length) return null;
  return (
    <section aria-labelledby="destacados" className="wave-y bg-lavanda/45">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-20 lg:px-8 lg:py-24">
        <SectionHeading id="destacados" title="Lo más querido de la casa" />
        <p className="eyebrow mt-4 text-center text-[0.65rem] text-carbon-suave md:hidden" aria-hidden="true">
          Desliza para ver más →
        </p>

        {/* Celular: carrusel con scroll-snap (asoma la siguiente tarjeta). Tablet y escritorio: grilla. */}
        <ul className="-mx-4 mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pt-6 pb-8 [scrollbar-width:none] md:mx-0 md:mt-14 md:grid md:snap-none md:grid-cols-2 md:gap-x-6 md:gap-y-10 md:overflow-visible md:p-0 lg:grid-cols-4">
          {products.map((product) => (
            <li key={product.id} className="flex w-[80%] max-w-80 shrink-0 snap-start md:w-auto md:max-w-none">
              <ProductCard product={product} />
            </li>
          ))}
        </ul>

        <div className="mt-6 flex justify-center md:mt-14">
          <ButtonLink href="/tienda" variant="light">
            Ver toda la tienda <ArrowIcon className="size-4" />
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
