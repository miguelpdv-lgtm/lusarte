import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage } from "@/components/store/InfoPage";
import { business } from "@/lib/legal";
import { whatsappUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Política de tratamiento de datos personales",
  description: "Cómo Lusarte recoge, usa y protege tus datos personales según la Ley 1581 de 2012, y cómo ejercer tus derechos.",
  alternates: { canonical: "/privacidad" },
};

// Los datos del responsable salen de BUSINESS_* (variables de entorno).
export const dynamic = "force-dynamic";

const UPDATED = "19 de octubre de 2026";

export default function PrivacidadPage() {
  const b = business();
  return (
    <InfoPage
      title="Tratamiento de datos personales"
      intro={`En cumplimiento de la Ley 1581 de 2012 y el Decreto 1377 de 2013 (incorporado en el Decreto 1074 de 2015). Última actualización: ${UPDATED}.`}
    >
      <h2>1. Responsable del tratamiento</h2>
      <p>
        <strong>{b.legalName}</strong>
        {b.nit && `, NIT ${b.nit}`}, con el nombre comercial <strong>{b.tradeName}</strong>
        {b.address && `, domicilio en ${b.address}`}. Teléfono y WhatsApp: {b.phone}. Correo: {b.email}. Sitio web: {b.domain}.
      </p>

      <h2>2. Qué datos recogemos</h2>
      <ul>
        <li>Al comprar: nombre, tipo y número de documento, correo, celular, dirección de entrega (departamento, municipio, barrio, dirección e indicaciones) y los productos que pides.</li>
        <li>Del pago: el estado y la referencia de la transacción que nos informa Wompi. No recibimos ni guardamos los datos de tu tarjeta ni de tu cuenta.</li>
        <li>
          Si usas &ldquo;Usar mi ubicación&rdquo; en el pago, tu ubicación se usa solo en ese momento para sugerirte el barrio más cercano; no la guardamos.
        </li>
        <li>Cuando nos escribes por WhatsApp o correo: la información que nos compartas.</li>
      </ul>
      <p>No recogemos datos sensibles ni datos de niñas, niños o adolescentes.</p>

      <h2>3. Para qué los usamos</h2>
      <ul>
        <li>Procesar, confirmar, despachar y entregar tus pedidos, y coordinar contigo la entrega o el pago contra entrega.</li>
        <li>Registrar la venta y tus datos de cliente en nuestro sistema de inventario y ventas, y emitir el comprobante de tu compra.</li>
        <li>Enviarte correos sobre tu compra: confirmación, despacho, número de guía o franja de entrega, y novedades de tu pedido.</li>
        <li>Atender tus preguntas, peticiones, quejas, reclamos, cambios y garantías.</li>
        <li>Cumplir obligaciones legales, contables y tributarias, y prevenir fraudes.</li>
      </ul>
      <p>No vendemos ni alquilamos tus datos, y no te enviamos publicidad por correo sin tu autorización.</p>

      <h2>4. Con quién los compartimos</h2>
      <p>Solo con proveedores que nos ayudan a prestar el servicio, que actúan como encargados del tratamiento y únicamente para las finalidades anteriores:</p>
      <ul>
        <li>Wompi (Bancolombia): procesamiento de pagos en línea.</li>
        <li>Effi: sistema de inventario, ventas y clientes.</li>
        <li>Brevo: envío de los correos de tu pedido (sus servidores pueden estar fuera de Colombia).</li>
        <li>GoDaddy: alojamiento del sitio web y su base de datos (sus servidores pueden estar fuera de Colombia).</li>
        <li>Transportadoras y domiciliarios: tu nombre, teléfono y dirección, para entregarte el pedido.</li>
      </ul>
      <p>
        Cuando los datos se alojan o procesan fuera de Colombia, exigimos que el proveedor los proteja con niveles adecuados de seguridad, como lo establece la ley.
      </p>

      <h2>5. Autorización</h2>
      <p>
        Al marcar la casilla de aceptación en el pago, nos autorizas a tratar tus datos según esta política. También puedes autorizarnos de forma verbal o por escrito
        al escribirnos por WhatsApp o correo.
      </p>

      <h2>6. Tus derechos</h2>
      <p>Como titular puedes:</p>
      <ul>
        <li>Conocer, actualizar y rectificar tus datos.</li>
        <li>Pedir prueba de la autorización que nos diste.</li>
        <li>Saber cómo hemos usado tus datos.</li>
        <li>Revocar la autorización o pedir que suprimamos tus datos, cuando no exista un deber legal o contractual de conservarlos.</li>
        <li>Acceder gratis a tus datos.</li>
        <li>Presentar quejas ante la Superintendencia de Industria y Comercio (www.sic.gov.co), después de haber acudido a nosotros.</li>
      </ul>

      <h2>7. Cómo ejercerlos</h2>
      <p>
        Escríbenos al correo {b.email} o por <a href={whatsappUrl("¡Hola Lusarte! Quiero hacer una solicitud sobre mis datos personales.")}>WhatsApp al {b.phone}</a>, con
        tu nombre, documento, lo que solicitas y un medio para responderte.
      </p>
      <ul>
        <li>
          <strong>Consultas:</strong> respondemos dentro de los 10 días hábiles siguientes; si no es posible, te explicamos el motivo y respondemos en máximo 5 días
          hábiles más.
        </li>
        <li>
          <strong>Reclamos</strong> (corrección, actualización, supresión o revocatoria): respondemos dentro de los 15 días hábiles siguientes; si no es posible, te
          explicamos el motivo y respondemos en máximo 8 días hábiles más.
        </li>
      </ul>

      <h2>8. Seguridad y conservación</h2>
      <p>
        Protegemos tus datos con medidas técnicas y administrativas razonables (conexión cifrada, acceso restringido con contraseña al panel de la tienda). Los
        conservamos mientras sean necesarios para las finalidades descritas y para cumplir obligaciones legales y contables.
      </p>

      <h2>9. Cookies y almacenamiento del navegador</h2>
      <p>
        La tienda guarda tu carrito en tu propio navegador para que no lo pierdas. No usamos cookies de publicidad ni de seguimiento. El panel de administración usa
        una cookie de sesión solo para el personal de Lusarte.
      </p>

      <h2>10. Vigencia y cambios</h2>
      <p>
        Esta política rige desde su publicación. Si la cambiamos, publicaremos aquí la nueva versión con su fecha. Consulta también los{" "}
        <Link href="/terminos">términos y condiciones</Link>.
      </p>
    </InfoPage>
  );
}
