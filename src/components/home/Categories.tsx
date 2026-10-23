import Link from "next/link";
import { BrandIcon } from "@/components/ui/BrandIcon";
import { ArrowIcon } from "@/components/ui/icons";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { categories, categoryHref } from "@/data/catalog";

const tilts = ["-rotate-6", "rotate-3", "-rotate-3", "rotate-6", "-rotate-6", "rotate-3"];

// Versión suave (pastel) del color de cada categoría para la franja del nombre
const soft: Record<string, string> = {
  "bg-miel": "bg-miel/35",
  "bg-lavanda": "bg-lavanda/50",
  "bg-cielo": "bg-cielo/35",
  "bg-oliva": "bg-oliva/35",
  "bg-arena": "bg-arena/40",
  "bg-estrella": "bg-estrella/55",
};

export function Categories() {
  return (
    <section aria-labelledby="categorias" className="mx-auto max-w-6xl px-4 pt-12 pb-12 sm:px-6 md:pt-16 md:pb-16 lg:px-8">
      <SectionHeading id="categorias" title="¿Qué quieres encender hoy?" />

      {/* Celular: tarjetas horizontales (ícono a la izquierda). Desde sm: ícono arriba, en grilla. */}
      <ul className="mt-8 grid gap-3 sm:mt-10 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
        {categories.map((cat, i) => (
          <li key={cat.slug}>
            <Link
              href={categoryHref(cat)}
              className="group flex h-full overflow-hidden rounded-[1.25rem] bg-crema-claro ring-1 ring-carbon/10 transition-transform duration-200 hover:-translate-y-1 sm:flex-col"
            >
              {/* Bloque de color de la categoría con su ícono de línea de la marca */}
              <div className={`relative grid min-h-24 w-[38%] shrink-0 place-items-center sm:aspect-[4/3] sm:min-h-0 sm:w-full ${cat.tint}`}>
                <BrandIcon
                  src={cat.icon}
                  className={`size-14 text-carbon transition-transform duration-300 group-hover:scale-110 group-hover:rotate-0 sm:size-24 ${tilts[i]}`}
                />
              </div>

              <div className={`flex flex-1 items-center justify-between gap-3 px-4 py-5 sm:py-4 ${soft[cat.tint]}`}>
                <h3 className="font-display text-[0.95rem] leading-tight font-bold sm:text-base">{cat.name}</h3>
                <ArrowIcon className="size-4 shrink-0 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
