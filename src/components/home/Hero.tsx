import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import { BrandIcon } from "@/components/ui/BrandIcon";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { ArrowIcon, WhatsAppIcon } from "@/components/ui/icons";
import { StickerFrame } from "@/components/ui/StickerFrame";
import { whatsappUrl } from "@/lib/site";

// `float` rota vía la animación (--r).
const float = (deg: number) => ({ "--r": `${deg}deg` }) as CSSProperties;

/** Posiciona un adorno. El contenedor lleva la posición y la visibilidad por breakpoint. */
function Deco({ className, style, children }: { className: string; style?: CSSProperties; children: ReactNode }) {
  return (
    <div className={`absolute ${className}`} style={style}>
      {children}
    </div>
  );
}

export function Hero() {
  return (
    <section>
      {/* La onda de arriba la pone el header (sticky); aquí solo la de abajo */}
      <div className="wave-bottom relative overflow-hidden bg-lavanda px-4 pt-12 pb-14 sm:pt-16 sm:pb-20 lg:pt-20 lg:pb-24">
        <div className="relative mx-auto max-w-6xl">
          {/* Decoración en las esquinas: marcos del brand board + garabatos. En celular solo arco y círculo (sobre el lettering). */}
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            {/* Izquierda */}
            <Deco className="top-0 left-[4%] w-[13%] max-w-[140px] animate-float sm:left-0 sm:w-[12%]" style={float(-6)}>
              <StickerFrame shape="arco" tint="bg-oliva">
                <Image src="/brand/sticker-vela.webp" alt="" width={459} height={720} sizes="120px" className="w-[46%]" />
              </StickerFrame>
            </Deco>
            <Deco className="top-[34%] left-[13%] hidden h-7 w-5 sm:block">
              <BrandIcon src="/brand/icon-destello.svg" className="size-full text-carbon/70" />
            </Deco>
            <Deco className="top-[44%] left-[9%] hidden w-[9%] max-w-[100px] animate-spin-slow sm:block">
              <Image src="/brand/sello.svg" alt="" width={256} height={256} className="w-full" />
            </Deco>
            <Deco className="top-[54%] left-0 hidden h-16 w-4 sm:block lg:h-24 lg:w-6">
              <BrandIcon src="/brand/icon-candelabro.svg" className="size-full text-carbon/70" />
            </Deco>
            <Deco className="bottom-[2%] left-[3%] hidden w-[8%] max-w-[100px] animate-float-slow sm:block" style={float(8)}>
              <StickerFrame shape="rectangulo" tint="bg-cielo">
                <Image src="/brand/sticker-fosforo.webp" alt="" width={720} height={470} sizes="100px" className="w-[88%] -rotate-45" />
              </StickerFrame>
            </Deco>


            {/* Derecha */}
            <Deco className="top-0 right-[4%] w-[12%] max-w-[130px] animate-float-slow sm:right-0 sm:w-[11%]" style={float(8)}>
              <StickerFrame shape="circulo" tint="bg-arena">
                <Image src="/brand/sticker-estrella.webp" alt="" width={720} height={701} sizes="120px" className="w-[68%]" />
              </StickerFrame>
            </Deco>
            <Deco className="top-[30%] right-[1%] hidden h-7 w-5 sm:block">
              <BrandIcon src="/brand/icon-destello.svg" className="size-full text-carbon/70" />
            </Deco>
            <Deco className="top-[44%] right-[4%] hidden size-12 sm:block lg:size-16">
              <BrandIcon src="/brand/icon-estrella.svg" className="size-full text-carbon/70" />
            </Deco>
            <Deco className="right-0 bottom-0 hidden w-[17%] max-w-[200px] animate-float sm:block" style={float(-8)}>
              <StickerFrame shape="pildora" tint="bg-miel">
                <Image src="/brand/sticker-tijeras.webp" alt="" width={720} height={452} sizes="140px" className="w-[70%]" />
              </StickerFrame>
            </Deco>
          </div>

          {/* Contenido central: queda dentro del hueco que dejan las esquinas */}
          <div className="relative mx-auto flex w-full flex-col items-center pt-[18%] text-center sm:w-[70%] sm:pt-0 lg:w-[66%]">
            {/* Lettering del póster en dos líneas (ILUMINANDO / TU VIDA): palabras siempre completas */}
            <div
              data-intro-origin
              className="intro-brillo w-full max-w-[820px] [filter:drop-shadow(2px_2px_0_var(--color-crema-claro))] sm:[filter:drop-shadow(3px_3px_0_var(--color-crema-claro))]"
            >
              <BrandIcon src="/brand/lettering.svg" className="block aspect-[954/333] w-full text-carbon" />
            </div>

            <h1 className="mt-4 max-w-xl font-display text-[0.95rem] leading-snug font-extrabold tracking-tight text-balance sm:mt-6 sm:text-xl lg:mt-8 lg:text-[1.75rem] lg:leading-tight">
              Velas artesanales hechas a mano e insumos para crear las tuyas
            </h1>
          </div>

          {/* Botones en una fila: en celular usan todo el ancho (no solo el hueco central) */}
          <div className="relative mt-4 flex justify-center gap-2 sm:mt-6 sm:gap-3 lg:mt-8 [&>a]:max-sm:gap-1.5 [&>a]:max-sm:px-3 [&>a]:max-sm:py-2 [&>a]:max-sm:text-[0.7rem]">
            <ButtonLink href="/tienda">
              Ver la tienda <ArrowIcon className="size-3.5 sm:size-4" />
            </ButtonLink>
            <ButtonLink href={whatsappUrl()} variant="light" target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon className="size-3.5 sm:size-5" /> Pedir por WhatsApp
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
