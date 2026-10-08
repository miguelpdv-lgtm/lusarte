"use client";

import { useState } from "react";
import { BrandIcon } from "@/components/ui/BrandIcon";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { ArrowIcon, WhatsAppIcon } from "@/components/ui/icons";
import { whatsappUrl } from "@/lib/site";
import { Candle } from "./Candle";

// Si ya la encendieron, al volver al inicio navegando sigue encendida.
let litBefore = false;

const buttonBase =
  "toon toon-press inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold";

/** Hero "Enciéndela": arranca a oscuras y al encender la vela el fondo pasa a lavanda. */
export function Hero() {
  const [lit, setLit] = useState(litBefore);
  const [wasLit, setWasLit] = useState(litBefore);

  const toggle = () => {
    litBefore = !lit;
    setWasLit(true);
    setLit(!lit);
  };

  return (
    <section>
      {/* La onda de arriba la pone el header (sticky); aquí solo la de abajo.
          --toon-ink: en la oscuridad los contornos toon son crema para que se vean. */}
      <div
        className={`wave-bottom relative overflow-hidden px-4 pt-12 pb-16 transition-colors duration-900 sm:pt-16 sm:pb-20 lg:pt-20 lg:pb-24 ${
          lit ? "bg-lavanda text-carbon" : "bg-noche text-crema [--toon-ink:var(--color-crema)]"
        }`}
      >
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10">
          <Candle
            lit={lit}
            wasLit={wasLit}
            onToggle={toggle}
            className="order-first mx-auto w-40 sm:w-48 lg:order-last lg:w-full lg:max-w-[300px]"
          />

          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <div
              className={`w-full max-w-[720px] transition-[filter] duration-900 ${
                lit ? "[filter:drop-shadow(3px_3px_0_var(--color-crema-claro))]" : ""
              }`}
            >
              <BrandIcon src="/brand/lettering.svg" className="block aspect-[954/333] w-full" />
              <span className="sr-only">Iluminando tu vida</span>
            </div>

            <h1 className="mt-4 max-w-xl font-display text-lg leading-snug font-extrabold tracking-tight text-balance sm:mt-6 sm:text-xl lg:mt-8 lg:text-[1.75rem] lg:leading-tight">
              Velas artesanales hechas a mano e insumos para crear las tuyas
            </h1>

            <div className="mt-5 flex flex-wrap justify-center gap-2 sm:mt-6 sm:gap-3 lg:mt-8 lg:justify-start [&>*]:max-sm:gap-1.5 [&>*]:max-sm:px-4 [&>*]:max-sm:py-2.5 [&>*]:max-sm:text-xs">
              {lit ? (
                <ButtonLink href="/tienda">
                  Ver la tienda <ArrowIcon className="size-3.5 sm:size-4" />
                </ButtonLink>
              ) : (
                <button type="button" onClick={toggle} className={`${buttonBase} cursor-pointer bg-carbon text-crema`}>
                  Encender la vela
                </button>
              )}
              <ButtonLink
                href={whatsappUrl()}
                variant={lit ? "light" : "ghost"}
                target="_blank"
                rel="noopener noreferrer"
              >
                <WhatsAppIcon className="size-3.5 sm:size-5" /> Pedir por WhatsApp
              </ButtonLink>
            </div>

            <p className="mt-4 font-hand text-lg opacity-80 sm:mt-5" aria-live="polite">
              {lit ? "toca la llama para apagarla" : "toca la mecha para encenderla"}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
