import Image from "next/image";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { ArrowIcon } from "@/components/ui/icons";

// Foto provisional (generada con IA a partir de fotos reales de los productos). Para cambiarla, reemplazar
// public/hero/hero-panoramica.webp por otra panorámica 21:9 con los productos a la derecha y la pared libre a la izquierda.
const photo = { src: "/hero/hero-panoramica.webp", width: 2400, height: 1018 };

/** Hero de foto: panorámica de producto a todo el ancho, texto a la izquierda y borde ondulado abajo, como el header.
 *  Por debajo de 1280 px (no cabe el texto junto a los productos) el texto va arriba sobre el color de la pared
 *  y la foto debajo, recortada sobre los productos. */
export function Hero() {
  return (
    <section className="wave-bottom relative isolate overflow-hidden bg-[#c9b0c6] xl:h-[min(calc(100vw*9/21),780px)]">
      <div className="mx-auto max-w-6xl px-4 pt-16 pb-4 sm:px-6 sm:pb-8 lg:px-8 xl:flex xl:h-full xl:items-center xl:pt-12 xl:pb-16">
        <div className="max-w-xl xl:max-w-[34rem]">
          <p className="eyebrow text-carbon/75">Hecho a mano en Barranquilla</p>
          <h1 className="mt-3 text-balance font-display text-[2.3rem] font-extrabold leading-[1.04] tracking-tight sm:text-5xl xl:text-[3.3rem]">
            Velas hechas a mano e insumos para crear las tuyas
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-carbon/85 sm:text-lg">
            Ceras, fragancias, moldes y recipientes. Domicilio en Barranquilla y Soledad, y envíos a toda Colombia.
          </p>
          <ButtonLink href="/tienda" className="mt-6 px-7 py-3.5 text-base">
            Ver la tienda <ArrowIcon className="size-4" />
          </ButtonLink>
        </div>
      </div>

      <div className="relative aspect-[6/5] sm:aspect-[2/1] xl:absolute xl:inset-0 xl:-z-10 xl:aspect-auto">
        {/* Funde el bloque de color con la pared de la foto (solo en la versión apilada) */}
        <div aria-hidden="true" className="absolute inset-x-0 top-0 z-10 h-20 bg-linear-to-b from-[#c9b0c6] to-transparent xl:hidden" />
        <Image
          src={photo.src}
          alt="Vela con rosa de cera encendida, bolsa de cera de vaso, vela verde y vela de osito sobre una mesa de madera"
          width={photo.width}
          height={photo.height}
          priority
          sizes="100vw"
          className="size-full object-cover object-[88%_50%] sm:object-[85%_50%] xl:object-right"
        />
      </div>
    </section>
  );
}
