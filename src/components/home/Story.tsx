import { LogoStacked } from "@/components/brand/Logo";
import { BrandIcon } from "@/components/ui/BrandIcon";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { SectionHeading } from "@/components/ui/SectionHeading";

/** Garabato de la marca dentro del texto, como un sello pequeño. */
function Doodle({ src, tint, tilt }: { src: string; tint: string; tilt: string }) {
  return (
    <span
      aria-hidden="true"
      className={`toon mx-[0.18em] inline-grid size-[1.15em] translate-y-[-0.08em] place-items-center rounded-full align-middle ${tint} ${tilt}`}
    >
      <BrandIcon src={src} className="size-[0.82em] text-carbon" />
    </span>
  );
}

const highlight = "bg-[linear-gradient(transparent_62%,var(--color-lavanda)_62%)] px-1 box-decoration-clone";

// Texto provisional: reemplazar por la historia real de la marca.
export function Story() {
  return (
    <section aria-labelledby="historia" className="mx-auto max-w-5xl px-5 py-14 text-center sm:px-6 md:py-20">
      <SectionHeading id="historia" title="Nuestra historia" />

      <p className="mt-6 font-display text-[1.3rem] leading-[1.35] font-extrabold tracking-tight text-balance sm:text-3xl md:mt-8 lg:text-[2.6rem] lg:leading-[1.25]">
        En Lusarte creemos que encender una vela
        <Doodle src="/brand/icon-vela-plato.svg" tint="bg-lavanda" tilt="-rotate-6" />
        es un pequeño ritual. Por eso las hacemos a mano
        <Doodle src="/brand/icon-tijeras.svg" tint="bg-miel" tilt="rotate-6" />
        y compartimos nuestros insumos
        <Doodle src="/brand/icon-vela-ondulada.svg" tint="bg-cielo" tilt="-rotate-3" />
        para que tú también <span className={highlight}>ilumines</span>{" "}
        {/* "tu vida" + estrella juntas: la estrella nunca queda sola en una línea */}
        <span className="whitespace-nowrap">
          <span className={highlight}>tu vida</span>
          <Doodle src="/brand/icon-estrella.svg" tint="bg-estrella" tilt="rotate-12" />
        </span>
      </p>

      <div className="mt-8 flex flex-col items-center justify-center gap-5 sm:flex-row md:mt-10">
        <LogoStacked className="h-12 w-auto text-carbon" aria-hidden="true" />
        <ButtonLink href="/nosotros" variant="light">
          Conoce nuestra historia
        </ButtonLink>
      </div>
    </section>
  );
}
