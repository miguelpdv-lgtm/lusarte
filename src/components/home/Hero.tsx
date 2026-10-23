import Image from "next/image";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { ArrowIcon } from "@/components/ui/icons";
import { LusarteArch } from "./LusarteArch";

/** Hero "Arco": el ícono de la marca con stickers a la izquierda y el texto con el botón a la tienda a la derecha.
 * Fondo lavanda con borde ondulado abajo, como el header. */
export function Hero() {
  return (
    <section className="wave-bottom relative isolate overflow-hidden bg-lavanda">
      {/* Puntos crema de fondo */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(var(--color-crema-claro)_2.2px,transparent_2.6px)] opacity-70 bg-size-[26px_26px]"
      />
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 pt-14 pb-20 sm:px-6 lg:grid-cols-2 lg:gap-12 lg:px-8 lg:pt-20 lg:pb-28">
        <div className="relative mx-auto aspect-square w-full max-w-[300px] sm:max-w-[380px] lg:max-w-[440px]">
          <LusarteArch className="size-full overflow-visible drop-shadow-[8px_8px_0_var(--color-carbon)]" />
          <Image
            src="/brand/sticker-estrella.webp"
            alt=""
            width={720}
            height={701}
            className="pointer-events-none absolute -right-[4%] top-[6%] w-[20%] drop-shadow-[3px_4px_0_rgba(56,57,57,0.25)] [--r:8deg] motion-safe:animate-float"
          />
          <Image
            src="/brand/sticker-fosforo.webp"
            alt=""
            width={720}
            height={470}
            className="pointer-events-none absolute -left-[7%] top-[20%] sm:-left-[14%] w-[30%] [transform:rotate(-24deg)] drop-shadow-[3px_4px_0_rgba(56,57,57,0.25)] [--r:-24deg] motion-safe:animate-float-slow"
          />
        </div>

        <div className="flex flex-col items-center text-center">
          <h1 className="max-w-[18ch] text-balance font-display text-3xl font-extrabold leading-[1.1] sm:text-4xl lg:text-[2.6rem]">
            Velas hechas a mano e insumos para crear las tuyas
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-carbon/85 sm:text-lg">
            Ceras, fragancias, moldes y recipientes. Domicilio en Barranquilla y Soledad, y envíos a toda Colombia.
          </p>
          <ButtonLink href="/tienda" className="mt-7">
            Ver la tienda <ArrowIcon className="size-4" />
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
