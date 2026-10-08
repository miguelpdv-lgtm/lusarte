import type { Metadata } from "next";
import { InfoPage } from "@/components/store/InfoPage";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Política de tratamiento de datos",
  description: "Cómo Lusarte recoge, usa y protege tus datos personales según la Ley 1581 de 2012.",
  alternates: { canonical: "/privacidad" },
};

// TODO(lanzamiento): completar responsable (razón social, NIT, dirección y correo) y revisar con la clienta.
export default function PrivacidadPage() {
  return (
    <InfoPage title="Tratamiento de datos personales" draft>
      <p>
        En cumplimiento de la Ley 1581 de 2012 y el Decreto 1377 de 2013, Lusarte informa cómo trata los datos personales que recibe a
        través de esta tienda.
      </p>
      <h2>Qué datos recogemos</h2>
      <p>Nombre, correo, teléfono, documento (opcional) y dirección de entrega, que nos das al hacer un pedido o al escribirnos.</p>
      <h2>Para qué los usamos</h2>
      <ul>
        <li>Procesar, despachar y hacer seguimiento a tus pedidos.</li>
        <li>Enviarte correos sobre tu compra: confirmación, despacho y número de guía.</li>
        <li>Responder tus preguntas y solicitudes.</li>
        <li>Cumplir obligaciones legales y contables.</li>
      </ul>
      <p>Los pagos los procesa Wompi; Lusarte no recibe ni guarda los datos de tu tarjeta.</p>
      <h2>Tus derechos</h2>
      <p>
        Puedes conocer, actualizar, rectificar y suprimir tus datos, y revocar la autorización para tratarlos. Para hacerlo, escríbenos por
        WhatsApp al {site.phone}.
      </p>
    </InfoPage>
  );
}
