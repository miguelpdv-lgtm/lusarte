import Image from "next/image";
import Link from "next/link";
import { PlusIcon } from "@/components/ui/icons";
import type { Product } from "@/data/sample";
import { formatCOP } from "@/lib/format";

export function ProductCard({ product }: { product: Product }) {
  const href = `/producto/${product.slug}`;
  return (
    <article className="group toon toon-shadow relative flex w-full flex-col rounded-[1.75rem] bg-crema-claro p-2.5 transition-transform duration-200 hover:-translate-y-1.5 hover:-rotate-1">
      <div className="relative aspect-square">
        <div className="absolute inset-0 overflow-hidden rounded-[1.25rem] border-2 border-carbon">
          <Image
            src={product.image}
            alt={product.imageAlt}
            fill
            sizes="(min-width: 1024px) 280px, (min-width: 640px) 45vw, 90vw"
            placeholder="blur"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        {product.badge && (
          <span className="eyebrow toon absolute -top-4 -right-3 z-10 rotate-6 rounded-full bg-estrella px-3 py-1 text-[0.6rem]">
            {product.badge}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col px-2 pt-4 pb-1">
        <p className="eyebrow text-[0.6rem] text-carbon-suave">{product.category}</p>
        <h3 className="mt-1 font-display text-xl leading-tight font-extrabold">
          <Link href={href} className="after:absolute after:inset-0 after:content-['']">
            {product.name}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-carbon-suave">{product.description}</p>

        <div className="mt-auto flex items-end justify-between gap-2 pt-4">
          <div>
            <p className="font-display text-xl leading-none font-extrabold">
              {product.from && <span className="mr-1 text-xs font-bold text-carbon-suave">Desde</span>}
              {formatCOP(product.price)}
              {product.unit && <span className="ml-1 text-xs font-bold text-carbon-suave">{product.unit}</span>}
            </p>
            {product.note && <p className="mt-1.5 text-xs font-semibold text-carbon-suave">{product.note}</p>}
          </div>
          <button
            type="button"
            aria-label={`Agregar ${product.name} al carrito`}
            className="toon toon-press relative z-10 grid size-10 shrink-0 place-items-center rounded-full bg-estrella"
          >
            <PlusIcon className="size-5" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </article>
  );
}
