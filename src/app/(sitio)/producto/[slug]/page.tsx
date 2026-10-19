import { syncEffiIfStale } from "@/lib/effi/auto";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/store/Breadcrumbs";
import { BuyBox } from "@/components/store/BuyBox";
import { Gallery } from "@/components/store/Gallery";
import { ProductCard, ProductThumb } from "@/components/ui/ProductCard";
import { categoryHref, findCategory, findSubcategory, subcategoryHref } from "@/data/catalog";
import { getCatalog, getProduct } from "@/lib/catalog/queries";
import { isOptionAvailable, isProductAvailable, type Product } from "@/lib/catalog/types";
import { shippingRange } from "@/lib/shop/shipping";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

const summary = (p: Product) => p.description.replace(/\s+/g, " ").trim().slice(0, 155);

export async function generateMetadata({ params }: PageProps<"/producto/[slug]">): Promise<Metadata> {
  const product = await getProduct((await params).slug);
  if (!product) return {};
  const image = product.images[0];
  return {
    title: product.name,
    description: summary(product) || `${product.name} en Lusarte.`,
    alternates: { canonical: `/producto/${product.slug}` },
    openGraph: image ? { images: [{ url: image.url, width: image.width, height: image.height, alt: image.alt }] } : undefined,
  };
}

/** Descripción con párrafos (saltos de línea) y listas (líneas que empiezan con "- "). */
function Description({ text }: { text: string }) {
  const blocks: { list: boolean; lines: string[] }[] = [];
  for (const line of text.split("\n").map((l) => l.trim()).filter(Boolean)) {
    const list = line.startsWith("- ");
    const last = blocks.at(-1);
    if (list && last?.list) last.lines.push(line.slice(2));
    else blocks.push({ list, lines: [list ? line.slice(2) : line] });
  }
  return (
    <div className="grid gap-3 leading-relaxed text-carbon/90">
      {blocks.map((b, i) =>
        b.list ? (
          <ul key={i} className="list-disc space-y-1 pl-5">
            {b.lines.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        ) : (
          <p key={i}>{b.lines[0]}</p>
        ),
      )}
    </div>
  );
}

export default async function ProductoPage({ params }: PageProps<"/producto/[slug]">) {
  syncEffiIfStale();
  const product = await getProduct((await params).slug);
  if (!product) notFound();

  const category = findCategory(product.category);
  const subcategory = findSubcategory(product.category, product.subcategory);
  const [catalog, { localNames }] = await Promise.all([getCatalog(), shippingRange()]);
  const related = catalog
    .filter((p) => p.id !== product.id && p.category === product.category && isProductAvailable(p))
    .sort((a, b) => Number(b.subcategory === product.subcategory) - Number(a.subcategory === product.subcategory) || b.images.length - a.images.length)
    .slice(0, 4);

  const url = new URL(`/producto/${product.slug}`, site.url).toString();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: summary(product),
    url,
    image: product.images.map((i) => new URL(i.url, site.url).toString()),
    brand: { "@type": "Brand", name: site.name },
    category: category?.name,
    offers: product.options.map((o) => ({
      "@type": "Offer",
      name: o.name,
      price: o.price,
      priceCurrency: "COP",
      availability: isOptionAvailable(o) ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url,
    })),
  };

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 pt-6 pb-16 sm:px-6 lg:px-8 lg:pt-10">
        <Breadcrumbs
          items={[
            { label: "Tienda", href: "/tienda" },
            ...(category ? [{ label: category.short, href: categoryHref(category) }] : []),
            ...(category && subcategory ? [{ label: subcategory.name, href: subcategoryHref(category, subcategory) }] : []),
            { label: product.name },
          ]}
        />

        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-14">
          <div className="lg:sticky lg:top-32 lg:self-start">
            {product.images.length ? (
              <Gallery images={product.images} name={product.name} />
            ) : (
              <div className="toon toon-shadow relative aspect-square overflow-hidden rounded-[1.75rem]">
                <ProductThumb product={product} sizes="(min-width: 1024px) 560px, 100vw" />
              </div>
            )}
          </div>

          <div className="grid content-start gap-6">
            <div>
              {product.badge && (
                <span className="eyebrow toon mb-3 inline-block -rotate-2 rounded-full bg-estrella px-3 py-1 text-[0.65rem]">{product.badge}</span>
              )}
              <h1 className="font-display text-3xl leading-tight font-extrabold text-balance sm:text-4xl">{product.name}</h1>
              {product.warning && (
                <p className="mt-3 inline-block rounded-xl bg-miel/60 px-3 py-1.5 text-sm font-bold">⚠ {product.warning}</p>
              )}
            </div>

            <BuyBox name={product.name} slug={product.slug} image={product.images[0]?.url ?? null} options={product.options} personalization={product.personalization} />

            {product.description && (
              <section aria-labelledby="descripcion" className="border-t-2 border-carbon/10 pt-6">
                <h2 id="descripcion" className="font-hand text-2xl">
                  Descripción
                </h2>
                <div className="mt-3">
                  <Description text={product.description} />
                </div>
              </section>
            )}

            <p className="rounded-2xl bg-lavanda/50 px-4 py-3 text-sm">
              {localNames.length > 0 && (
                <>
                  <strong>Domicilio en {localNames.join(" y ")}</strong> y{" "}
                </>
              )}
              <strong>envíos a toda Colombia</strong>. El valor del envío se calcula con tu ciudad al pagar.
            </p>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section aria-labelledby="relacionados" className="wave-top bg-lavanda/45 pt-6">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
            <h2 id="relacionados" className="font-hand text-3xl sm:text-4xl">
              También te puede gustar
            </h2>
            <ul className="mt-8 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-6 lg:grid-cols-4">
              {related.map((p) => (
                <li key={p.id} className="flex">
                  <ProductCard product={p} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </>
  );
}
