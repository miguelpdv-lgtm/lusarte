import Image from "next/image";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { ArrowIcon } from "@/components/ui/icons";
import { categories, navidad, subcategoryHref } from "@/data/catalog";

const moldes = categories.find((c) => c.slug === "moldes")!;
const moldesNavidad = moldes.subcategories.find((s) => s.slug === "navidad-2026")!;

/** Colección de temporada: "Sale navidad" + "Moldes navidad 2026". */
export function SeasonBanner() {
  return (
    <section aria-labelledby="temporada" className="px-4 pb-16 sm:px-6 md:pb-20 lg:px-8 lg:pb-28">
      <div className="toon relative mx-auto flex max-w-6xl flex-col gap-6 overflow-hidden rounded-[1.75rem] bg-carbon px-6 py-8 text-crema shadow-[6px_6px_0_0_var(--color-miel)] md:flex-row md:items-center md:gap-8 md:rounded-[2rem] md:px-12 md:py-12">
        <div className="pattern pointer-events-none absolute inset-0 text-crema/[0.06]" aria-hidden="true" />

        {/* En celular la estrella se asoma por la esquina; en escritorio va a la izquierda */}
        <Image
          src="/brand/sticker-estrella.webp"
          alt=""
          width={720}
          height={701}
          sizes="160px"
          className="absolute -top-3 -right-3 w-24 -rotate-12 md:relative md:top-auto md:right-auto md:w-36 md:shrink-0"
        />

        <div className="relative flex-1 pr-16 md:pr-0">
          <p className="eyebrow text-miel">Temporada</p>
          <h2 id="temporada" className="mt-2 font-display text-4xl leading-none font-extrabold tracking-tight sm:text-5xl">
            {navidad.name} 2026
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-crema/80 md:text-base">{navidad.description}</p>
        </div>

        <div className="relative flex shrink-0 flex-col gap-3 md:w-auto">
          <ButtonLink href={navidad.href} className="shadow-[4px_4px_0_0_var(--color-miel)]!">
            Ver el sale <ArrowIcon className="size-4" />
          </ButtonLink>
          <div className="hidden md:contents">
            <ButtonLink
              href={subcategoryHref(moldes, moldesNavidad)}
              variant="light"
              className="shadow-[4px_4px_0_0_var(--color-miel)]!"
            >
              Moldes {moldesNavidad.name}
            </ButtonLink>
          </div>
          <Link
            href={subcategoryHref(moldes, moldesNavidad)}
            className="text-center text-sm font-bold underline decoration-miel decoration-2 underline-offset-4 md:hidden"
          >
            Ver moldes {moldesNavidad.name}
          </Link>
        </div>
      </div>
    </section>
  );
}
