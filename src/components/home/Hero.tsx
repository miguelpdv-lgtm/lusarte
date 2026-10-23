import Image from "next/image";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { ArrowIcon, WhatsAppIcon } from "@/components/ui/icons";
import { whatsappUrl } from "@/lib/site";

// Fotos provisionales (generadas con IA a partir de fotos reales de los productos): cambiarlas por las de la clienta
// en public/hero/ sin tocar el diseño.
const photos = [
  { src: "/hero/vela-rosa.webp", alt: "Vela artesanal en vaso con una rosa lavanda de cera, encendida", caption: "velas hechas a mano", tape: "bg-lavanda", place: "left-0 top-[6%] z-[2] w-[46%] -rotate-[7deg] sm:w-[250px]" },
  { src: "/hero/cera-de-vaso.webp", alt: "Bolsa de cera de vaso de 1 kg", caption: "cera de vaso", tape: "bg-estrella", place: "right-0 top-0 z-[2] w-[44%] rotate-[5deg] sm:w-[230px]" },
  { src: "/hero/velas-oso.webp", alt: "Vela verde y vela en forma de oso", caption: "moldes y formas", tape: "bg-miel", place: "bottom-0 left-[27%] z-[1] w-[46%] -rotate-2 sm:w-[240px]" },
];

/** Hero "Polaroids": el lettering de la marca y tres fotos de producto pegadas con cinta, con notas a mano y stickers. */
export function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-crema-claro">
      {/* Puntos lavanda de fondo */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(var(--color-lavanda)_2.2px,transparent_2.6px)] bg-size-[26px_26px]"
      />
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-8 px-4 pt-10 pb-16 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:gap-6 lg:px-8 lg:pt-16 lg:pb-24">
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
          {/* El h1 describe la tienda para Google; lo visible es el lettering */}
          <h1 className="sr-only">Lusarte: velas artesanales e insumos para hacer velas, con envíos a toda Colombia</h1>
          <p aria-hidden="true" className="font-lettering text-[3.4rem] leading-[0.95] -rotate-2 sm:text-7xl lg:text-[5.6rem]">
            Iluminando
            <br />
            tu vida
          </p>
          <p className="mt-6 max-w-md text-base leading-relaxed text-carbon/85 sm:text-lg">
            Velas hechas a mano e insumos para crear las tuyas: ceras, fragancias, moldes y recipientes. Domicilio en Barranquilla y Soledad, y envíos a toda Colombia.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3 lg:justify-start">
            <ButtonLink href="/tienda">
              Ver la tienda <ArrowIcon className="size-4" />
            </ButtonLink>
            <ButtonLink href={whatsappUrl()} variant="light" target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon className="size-5" /> Pedir por WhatsApp
            </ButtonLink>
          </div>
        </div>

        {/* Tablero de polaroids */}
        <div className="relative order-first mx-auto h-[330px] w-full max-w-[420px] sm:h-[420px] sm:max-w-[520px] lg:order-none lg:h-[470px]">
          {photos.map((p, i) => (
            <figure
              key={p.src}
              className={`absolute rounded-md border-[2.5px] border-carbon bg-white p-2.5 pb-10 shadow-[6px_6px_0_var(--color-carbon)] transition-transform duration-300 hover:z-10 hover:scale-[1.03] hover:rotate-0 sm:p-3 sm:pb-11 ${p.place}`}
            >
              <span aria-hidden="true" className={`absolute -top-3.5 left-1/2 h-7 w-20 -translate-x-1/2 border border-carbon/25 opacity-85 ${p.tape}`} />
              <Image
                src={p.src}
                alt={p.alt}
                width={720}
                height={720}
                priority={i === 0}
                sizes="(min-width: 640px) 250px, 45vw"
                className="aspect-square w-full border border-carbon/20 object-cover"
              />
              <figcaption className="absolute inset-x-0 bottom-2 text-center font-hand text-lg sm:text-xl">{p.caption}</figcaption>
            </figure>
          ))}
          <Image
            src="/brand/sticker-estrella.webp"
            alt=""
            width={720}
            height={701}
            className="pointer-events-none absolute right-[2%] bottom-[18%] z-[3] w-16 drop-shadow-[3px_4px_0_rgba(56,57,57,0.25)] [--r:8deg] motion-safe:animate-float sm:w-20"
          />
          <Image
            src="/brand/sticker-tijeras.webp"
            alt=""
            width={720}
            height={452}
            className="pointer-events-none absolute -left-[3%] bottom-[8%] z-[3] hidden w-36 [transform:rotate(-18deg)] drop-shadow-[3px_4px_0_rgba(56,57,57,0.25)] [--r:-18deg] motion-safe:animate-float-slow sm:block"
          />
        </div>
      </div>
    </section>
  );
}
