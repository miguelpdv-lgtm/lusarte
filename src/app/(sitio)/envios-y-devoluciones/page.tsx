import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage } from "@/components/store/InfoPage";

export const metadata: Metadata = {
  title: "Envíos y devoluciones",
  description: "Envíos a toda Colombia con tarifa fija, tiempos de despacho, número de guía y política de cambios y devoluciones.",
  alternates: { canonical: "/envios-y-devoluciones" },
};

// TODO(clienta): confirmar el valor de la tarifa, los tiempos de despacho y la política de cambios.
export default function EnviosPage() {
  return (
    <InfoPage title="Envíos y devoluciones" draft>
      <h2>Envíos</h2>
      <ul>
        <li>Enviamos a cualquier ciudad o municipio de Colombia con transportadora.</li>
        <li>El envío tiene una tarifa fija para todo el país, que ves en el carrito antes de pagar.</li>
        <li>Despachamos en 1 a 3 días hábiles después de confirmado el pago. Las velas personalizadas pueden tardar un poco más.</li>
        <li>Cuando despachamos te enviamos un correo con la transportadora y el número de guía para que sigas tu pedido.</li>
      </ul>
      <h2>Cambios y devoluciones</h2>
      <ul>
        <li>Si tu pedido llega incompleto o con un producto en mal estado, escríbenos dentro de los 5 días hábiles siguientes con fotos del empaque y del producto.</li>
        <li>Las velas personalizadas y los productos hechos a tu medida no tienen cambio, salvo por defectos de fabricación.</li>
        <li>
          Puedes ejercer el derecho de retracto en los términos de la Ley 1480 de 2011. Más detalles en los{" "}
          <Link href="/terminos">términos y condiciones</Link>.
        </li>
      </ul>
    </InfoPage>
  );
}
