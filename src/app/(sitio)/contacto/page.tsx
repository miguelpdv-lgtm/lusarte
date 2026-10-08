import type { Metadata } from "next";
import { InfoPage } from "@/components/store/InfoPage";
import { InstagramIcon, WhatsAppIcon } from "@/components/ui/icons";
import { site, whatsappUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contacto",
  description: "Escríbenos por WhatsApp o Instagram para pedidos, cotizaciones al por mayor y dudas sobre tus velas.",
  alternates: { canonical: "/contacto" },
};

export default function ContactoPage() {
  return (
    <InfoPage title="Contacto" intro="Pedidos, cotizaciones al por mayor o dudas sobre tus velas: escríbenos.">
      <ul className="grid gap-3 list-none! pl-0! sm:grid-cols-2">
        <li>
          <a
            href={whatsappUrl("¡Hola Lusarte! Tengo una pregunta.")}
            target="_blank"
            rel="noopener noreferrer"
            className="toon toon-press flex items-center gap-3 rounded-2xl bg-crema-claro p-4 no-underline!"
          >
            <WhatsAppIcon className="size-7 shrink-0" />
            <span>
              <span className="block text-sm font-semibold text-carbon-suave">WhatsApp</span>
              <span className="text-lg">{site.phone}</span>
            </span>
          </a>
        </li>
        <li>
          <a
            href={`https://instagram.com/${site.instagram}`}
            target="_blank"
            rel="noopener noreferrer"
            className="toon toon-press flex items-center gap-3 rounded-2xl bg-crema-claro p-4 no-underline!"
          >
            <InstagramIcon className="size-7 shrink-0" />
            <span>
              <span className="block text-sm font-semibold text-carbon-suave">Instagram</span>
              <span className="text-lg">@{site.instagram}</span>
            </span>
          </a>
        </li>
      </ul>
      <p>Te respondemos por WhatsApp lo antes posible. Si quieres una cotización al por mayor, cuéntanos qué productos y cuántas unidades necesitas.</p>
    </InfoPage>
  );
}
