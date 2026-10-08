import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { InfoPage } from "@/components/store/InfoPage";

export const metadata: Metadata = {
  title: "Nosotros",
  description: "Lusarte: velas artesanales hechas a mano e insumos para que hagas las tuyas.",
  alternates: { canonical: "/nosotros" },
};

// TODO(clienta): reemplazar por la historia real de la marca y fotos del proceso.
export default function NosotrosPage() {
  return (
    <InfoPage title="Nosotros" intro="Velas hechas a mano e insumos para que tú también hagas las tuyas." draft>
      <p>
        En Lusarte creemos que encender una vela es un pequeño ritual. Por eso hacemos nuestras velas a mano, una por una, y las
        personalizamos con los colores y mensajes que nos pidas para tus regalos, recordatorios y celebraciones.
      </p>
      <p>
        También compartimos lo que usamos en nuestro taller: ceras, parafinas, fragancias, moldes de silicona, recipientes y
        complementos, para que emprendas o crees tus propias velas en casa con insumos de calidad.
      </p>
      <p>Iluminando tu vida, una vela a la vez.</p>
      <div>
        <ButtonLink href="/tienda">Ver la tienda</ButtonLink>
      </div>
    </InfoPage>
  );
}
