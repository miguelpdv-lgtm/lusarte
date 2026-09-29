import Image from "next/image";
import type { CSSProperties } from "react";
import { PlusIcon, WhatsAppIcon } from "@/components/ui/icons";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { faqs } from "@/data/sample";
import { whatsappUrl } from "@/lib/site";

export function Faq() {
  return (
    <section aria-labelledby="faq" className="mx-auto max-w-6xl px-4 pt-4 pb-16 sm:px-6 lg:px-8 lg:pb-24">
      <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <SectionHeading
            id="faq"
            align="left"
            title="Resolvemos tus dudas"
            description="Si no encuentras lo que buscas, escríbenos y te respondemos lo antes posible."
          />
          <a
            href={whatsappUrl("¡Hola Lusarte! Tengo una pregunta.")}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-2 text-sm font-bold underline decoration-2 underline-offset-4 hover:decoration-miel"
          >
            <WhatsAppIcon className="size-5" /> Hacer otra pregunta
          </a>
          <Image
            src="/brand/sticker-estrella.webp"
            alt=""
            width={720}
            height={701}
            sizes="144px"
            className="mt-10 hidden w-36 animate-float lg:block"
            style={{ "--r": "12deg" } as CSSProperties}
          />
        </div>

        <div className="space-y-4">
          {faqs.map((item) => (
            <details
              key={item.q}
              name="faq"
              className="group toon rounded-[1.5rem] bg-crema-claro px-5 transition-shadow open:bg-estrella/40 open:shadow-[5px_5px_0_0_var(--color-carbon)] sm:px-6"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-4 font-display text-base font-bold sm:text-lg [&::-webkit-details-marker]:hidden">
                {item.q}
                <span className="toon grid size-9 shrink-0 place-items-center rounded-full bg-crema transition-transform duration-300 group-open:rotate-45">
                  <PlusIcon className="size-4" strokeWidth={2.5} />
                </span>
              </summary>
              <p className="max-w-2xl pb-6 leading-relaxed text-carbon/85">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
