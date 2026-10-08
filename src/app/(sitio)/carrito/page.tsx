import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { WhatsAppIcon } from "@/components/ui/icons";
import { InfoPage } from "@/components/store/InfoPage";
import { whatsappUrl } from "@/lib/site";

export const metadata: Metadata = { title: "Carrito", robots: { index: false } };

// TODO(fase 6): carrito real (localStorage) con tarifa fija de envío y paso al checkout con Wompi.
export default function CarritoPage() {
  return (
    <InfoPage title="Tu carrito" intro="Muy pronto podrás pagar en línea. Mientras tanto, haz tu pedido por WhatsApp desde cada producto.">
      <div className="flex flex-wrap gap-3">
        <ButtonLink href="/tienda">Ver la tienda</ButtonLink>
        <ButtonLink href={whatsappUrl()} variant="light" target="_blank" rel="noopener noreferrer">
          <WhatsAppIcon className="size-5" /> Pedir por WhatsApp
        </ButtonLink>
      </div>
    </InfoPage>
  );
}
