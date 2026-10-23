import Link from "next/link";
import { BrandIcon } from "@/components/ui/BrandIcon";
import { ArrowIcon } from "@/components/ui/icons";
import { categories, categoryHref } from "@/data/catalog";

const bySlug = (slug: string) => categories.find((c) => c.slug === slug)!;

// Guía corta que conecta cada paso con la categoría de la tienda donde están los insumos.
const steps = [
  {
    title: "Elige tu cera",
    text: "Para velas en recipiente, la cera de vaso (70% palma y 30% parafina) se funde entre 50 y 56 °C.",
    icon: "/brand/icon-vela-cuadrada.svg",
    tint: "bg-miel",
    category: bySlug("ceras-y-aditivos"),
  },
  {
    title: "Dale aroma",
    text: "Agrega la fragancia a la cera derretida. Revisa siempre que sea compatible con el tipo de cera que usas.",
    icon: "/brand/icon-fosforo.svg",
    tint: "bg-lavanda",
    category: bySlug("fragancias"),
  },
  {
    title: "Vierte o moldea",
    text: "Centra la mecha, vierte en un recipiente o en un molde y deja enfriar por completo antes de desmoldar.",
    icon: "/brand/icon-vela-ondulada.svg",
    tint: "bg-cielo",
    category: bySlug("moldes"),
  },
  {
    title: "Decora y empaca",
    text: "Termina con flores preservadas y empaques listos para regalar o vender tus velas.",
    icon: "/brand/icon-vela-frasco.svg",
    tint: "bg-arena",
    category: bySlug("recipientes-y-empaques"),
  },
];

export function StepsGuide() {
  return (
    // Franja verde suave a todo el ancho con bordes ondulados, con título manuscrito subrayado y garabato de vela
    <section aria-labelledby="pasos" className="wave-y bg-oliva/45">
      <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-24 lg:px-8">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h2 id="pasos" className="font-hand text-[2rem] leading-tight sm:text-4xl lg:text-[2.75rem]">
              Tu primera vela en 4 pasos
            </h2>
            <svg className="mt-1 h-3 w-48 text-carbon sm:w-64" viewBox="0 0 260 12" fill="none" aria-hidden="true">
              <path d="M3 8c40-5 90-7 140-5s80 4 114 1" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-carbon/80 sm:text-base">
              Todo lo que necesitas para empezar está en la tienda.
            </p>
          </div>
          <div className="relative shrink-0" aria-hidden="true">
            <BrandIcon src="/brand/icon-vela-plato.svg" className="h-24 w-14 text-carbon sm:h-32 sm:w-20" />
            <BrandIcon src="/brand/icon-destello.svg" className="absolute top-0 -right-3 h-6 w-4 text-carbon" />
          </div>
        </div>

        {/* Celular: línea de tiempo vertical punteada. Desde md: 4 columnas suaves. */}
        <ol className="relative mt-8 grid gap-8 before:absolute before:top-5 before:bottom-8 before:left-[19px] before:border-l-[3px] before:border-dashed before:border-carbon/40 md:mt-10 md:grid-cols-2 md:gap-4 md:before:hidden lg:grid-cols-4">
          {steps.map((step, i) => (
            <li key={step.title} className="relative flex flex-col pl-14 md:rounded-2xl md:bg-crema-claro/80 md:p-5 md:pt-6">
              {/* Número del paso, como sello */}
              <span
                aria-hidden="true"
                className={`toon absolute top-0 left-0 grid size-10 place-items-center rounded-full font-display text-lg font-extrabold md:static md:mb-4 ${step.tint} ${
                  i % 2 ? "rotate-6" : "-rotate-6"
                }`}
              >
                {i + 1}
              </span>
              <span className="absolute top-5 right-5 hidden md:block" aria-hidden="true">
                <BrandIcon src={step.icon} className="size-10 text-carbon/70" />
              </span>

              <h3 className="pt-1.5 font-display text-lg font-extrabold tracking-tight md:pt-0">
                <span className="sr-only">Paso {i + 1}: </span>
                {step.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-carbon/80">{step.text}</p>
              <Link
                href={categoryHref(step.category)}
                className="group mt-auto inline-flex items-center gap-1.5 pt-3 text-sm font-bold underline decoration-2 underline-offset-4 hover:decoration-miel md:pt-4"
              >
                Ver {step.category.short.toLowerCase()}
                <ArrowIcon className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
