/* eslint-disable @next/next/no-img-element -- <picture> con getImageProps: foto distinta en celular y computador */
import { getImageProps } from "next/image";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { ArrowIcon } from "@/components/ui/icons";
import { getHeroPhotos } from "@/lib/home/hero";

// La foto incluida tiene su descripción exacta; para las subidas desde el panel, una general
const DEFAULT_ALT = "Vela con rosa de cera encendida, bolsa de cera de vaso, vela verde y vela de osito sobre una mesa de madera";
const CUSTOM_ALT = "Velas hechas a mano e insumos de Lusarte";

/** Hero de foto: panorámica de producto a todo el ancho, texto a la izquierda y borde ondulado abajo, como el header.
 *  Por debajo de 1280 px (no cabe el texto junto a los productos) el texto va arriba y centrado sobre el color
 *  de la pared, y la foto debajo: la de celular si se subió una en Panel → Portada, o la de computador recortada
 *  sobre los productos (HERO_MOBILE_CROP en hero-layout.ts; el recuadro es aspect-[6/5] = HERO_MOBILE_ASPECT). */
export async function Hero() {
  const { desktop, mobile } = await getHeroPhotos();
  const alt = (mobile ?? desktop).custom ? CUSTOM_ALT : DEFAULT_ALT;
  const common = { alt, sizes: "100vw", preload: true } as const;
  const { props: desktopProps } = getImageProps({ ...common, src: desktop.src, width: desktop.width, height: desktop.height });
  const mobileProps = mobile ? getImageProps({ ...common, src: mobile.src, width: mobile.width, height: mobile.height }).props : null;
  // Fotos subidas: van centradas; la panorámica se recorta hacia la derecha, donde están los productos
  const position = mobile ? "object-center" : "object-[88%_50%] sm:object-[85%_50%]";

  return (
    <section className="wave-bottom relative isolate overflow-hidden bg-[#c9b0c6] xl:h-[min(calc(100vw*9/21),780px)]">
      <div className="mx-auto max-w-6xl px-5 pt-24 pb-10 sm:px-6 sm:pt-20 sm:pb-10 lg:px-8 xl:flex xl:h-full xl:items-center xl:pt-12 xl:pb-16">
        <div className="mx-auto max-w-xl text-center xl:mx-0 xl:max-w-[34rem] xl:text-left">
          <p className="eyebrow text-carbon/75">Hecho a mano en Barranquilla</p>
          <h1 className="mt-3 text-balance font-display text-[2.15rem] font-extrabold leading-[1.05] tracking-tight sm:text-5xl xl:text-[3.3rem]">
            Velas hechas a mano e insumos para crear las tuyas
          </h1>
          <p className="mx-auto mt-4 max-w-md text-pretty text-base leading-relaxed text-carbon/85 sm:text-lg xl:mx-0">
            Ceras, fragancias, moldes y recipientes. Domicilio en Barranquilla y Soledad, y envíos a toda Colombia.
          </p>
          <ButtonLink href="/tienda" className="mt-6 px-7 py-3.5 text-base">
            Ver la tienda <ArrowIcon className="size-4" />
          </ButtonLink>
        </div>
      </div>

      <div className="relative aspect-[6/5] sm:aspect-[2/1] xl:absolute xl:inset-0 xl:-z-10 xl:aspect-auto">
        {/* Funde el bloque de color con la pared de la foto (solo en la versión apilada) */}
        <div aria-hidden="true" className="absolute inset-x-0 top-0 z-10 h-16 bg-linear-to-b from-[#c9b0c6] to-transparent xl:hidden" />
        {mobileProps ? (
          <picture>
            <source media="(min-width: 1280px)" srcSet={desktopProps.srcSet} sizes="100vw" />
            <img {...mobileProps} alt={alt} fetchPriority="high" className={`size-full object-cover ${position} xl:object-right`} />
          </picture>
        ) : (
          <img {...desktopProps} alt={alt} fetchPriority="high" className={`size-full object-cover ${position} xl:object-right`} />
        )}
      </div>
    </section>
  );
}
