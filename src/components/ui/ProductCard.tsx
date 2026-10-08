import Image from "next/image";
import Link from "next/link";
import { BrandIcon } from "@/components/ui/BrandIcon";
import { ArrowIcon } from "@/components/ui/icons";
import { findCategory, findSubcategory } from "@/data/catalog";
import { cheapestOption, isProductAvailable, type Product } from "@/lib/catalog/types";
import { formatCOP } from "@/lib/format";

/** Foto principal o, si aún no tiene, el ícono de su categoría sobre el color de la marca. */
export function ProductThumb({ product, sizes }: { product: Product; sizes: string }) {
  const image = product.images[0];
  if (image) return <Image src={image.url} alt={image.alt} fill sizes={sizes} className="object-cover transition-transform duration-500 group-hover:scale-105" />;
  const category = findCategory(product.category);
  return (
    <div className={`grid size-full place-items-center ${category?.tint ?? "bg-lavanda"}`}>
      <BrandIcon src={category?.icon ?? "/brand/icon-vela-ondulada.svg"} className="size-1/2 text-carbon/70" />
    </div>
  );
}

export function ProductCard({ product }: { product: Product }) {
  const href = `/producto/${product.slug}`;
  const cheapest = cheapestOption(product);
  const available = isProductAvailable(product);
  const several = new Set(product.options.map((o) => o.price)).size > 1;
  const label = findSubcategory(product.category, product.subcategory)?.name ?? findCategory(product.category)?.short;

  return (
    <article className="group toon toon-shadow relative flex w-full min-w-0 flex-col rounded-[1.75rem] bg-crema-claro p-2.5 transition-transform duration-200 hover:-translate-y-1.5 hover:-rotate-1">
      <div className="relative aspect-square">
        <div className={`absolute inset-0 overflow-hidden rounded-[1.25rem] border-2 border-carbon ${available ? "" : "grayscale-[60%]"}`}>
          <ProductThumb product={product} sizes="(min-width: 1024px) 280px, (min-width: 640px) 45vw, 90vw" />
        </div>
        {!available ? (
          <span className="eyebrow toon absolute -top-4 -right-3 z-10 rotate-6 rounded-full bg-carbon px-3 py-1 text-[0.6rem] text-crema">Agotado</span>
        ) : (
          product.badge && (
            <span className="eyebrow toon absolute -top-4 -right-3 z-10 rotate-6 rounded-full bg-estrella px-3 py-1 text-[0.6rem]">{product.badge}</span>
          )
        )}
      </div>

      <div className="flex flex-1 flex-col px-2 pt-4 pb-1">
        {label && <p className="eyebrow text-[0.6rem] text-carbon-suave">{label}</p>}
        <h3 className="mt-1 font-display text-lg leading-tight font-extrabold sm:text-xl">
          <Link href={href} className="after:absolute after:inset-0 after:content-['']">
            {product.name}
          </Link>
        </h3>
        {product.warning && <p className="mt-1.5 text-xs font-semibold text-carbon-suave">{product.warning}</p>}

        <div className="mt-auto flex items-end justify-between gap-2 pt-4">
          {cheapest && (
            <p className="min-w-0 font-display text-lg leading-none font-extrabold tabular-nums sm:text-xl">
              {several && <span className="mb-1 block text-xs font-bold text-carbon-suave">Desde</span>}
              {formatCOP(cheapest.price)}
              {cheapest.compareAtPrice && (
                <s className="mt-1 block text-xs font-semibold text-carbon-suave">{formatCOP(cheapest.compareAtPrice)}</s>
              )}
            </p>
          )}
          <span
            aria-hidden="true"
            className="toon relative z-10 grid size-9 shrink-0 sm:size-10 place-items-center rounded-full bg-estrella transition-transform group-hover:translate-x-0.5"
          >
            <ArrowIcon className="size-4" />
          </span>
        </div>
      </div>
    </article>
  );
}
