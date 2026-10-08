import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage } from "@/components/store/InfoPage";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Términos y condiciones",
  description: "Condiciones de compra en la tienda en línea de Lusarte: precios, pagos, envíos, retracto y garantía.",
  alternates: { canonical: "/terminos" },
};

// TODO(lanzamiento): revisar con la clienta (y su asesor) antes de publicar. Falta razón social, NIT y ciudad.
export default function TerminosPage() {
  return (
    <InfoPage title="Términos y condiciones" draft>
      <p>
        Estos términos regulan las compras en {site.url.replace("https://", "")}. Al hacer un pedido aceptas estas condiciones.
      </p>
      <h2>Precios y pagos</h2>
      <ul>
        <li>Los precios están en pesos colombianos (COP) y pueden cambiar sin previo aviso; se respeta el precio que viste al pagar.</li>
        <li>Los pagos se procesan con Wompi: tarjeta débito o crédito, PSE, Nequi y Botón Bancolombia. Lusarte no almacena los datos de tu tarjeta.</li>
        <li>El pedido se confirma cuando el pago queda aprobado.</li>
      </ul>
      <h2>Envíos</h2>
      <p>
        Las condiciones de envío están en <Link href="/envios-y-devoluciones">envíos y devoluciones</Link>.
      </p>
      <h2>Derecho de retracto</h2>
      <p>
        De acuerdo con el artículo 47 de la Ley 1480 de 2011 (Estatuto del Consumidor), puedes retractarte de tu compra dentro de los 5
        días hábiles siguientes a la entrega, devolviendo el producto sin usar y en su empaque original. Los costos de transporte de la
        devolución corren por tu cuenta. No aplica para productos personalizados o hechos según tus especificaciones.
      </p>
      <h2>Reversión del pago</h2>
      <p>
        Según el artículo 51 de la Ley 1480 de 2011, puedes solicitar la reversión del pago en los casos previstos por la ley (fraude,
        operación no solicitada, producto no recibido o que no corresponde a lo pedido) dentro de los 5 días hábiles siguientes a la fecha
        en que tuviste noticia del problema.
      </p>
      <h2>Garantía</h2>
      <p>Si un producto llega con defectos, escríbenos y lo cambiamos o te devolvemos el dinero, según el caso.</p>
      <h2>Datos personales</h2>
      <p>
        El uso de tus datos está descrito en la <Link href="/privacidad">política de tratamiento de datos</Link>.
      </p>
    </InfoPage>
  );
}
