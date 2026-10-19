import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage } from "@/components/store/InfoPage";
import { business } from "@/lib/legal";
import { whatsappUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Términos y condiciones",
  description: "Condiciones de compra en la tienda en línea de Lusarte: precios, pagos, entregas, retracto, reversión del pago y garantía.",
  alternates: { canonical: "/terminos" },
};

// Los datos del responsable salen de BUSINESS_* (variables de entorno).
export const dynamic = "force-dynamic";

const UPDATED = "19 de octubre de 2026";

export default function TerminosPage() {
  const b = business();
  return (
    <InfoPage title="Términos y condiciones" intro={`Condiciones de compra en ${b.domain}. Última actualización: ${UPDATED}.`}>
      <h2>1. Quiénes somos</h2>
      <p>
        {b.domain} es la tienda en línea de <strong>{b.tradeName}</strong>, nombre comercial de <strong>{b.legalName}</strong>
        {b.nit && `, identificada con NIT ${b.nit}`}
        {b.regime && ` (${b.regime})`}
        {b.address && `, con domicilio en ${b.address}`}. Teléfono y WhatsApp: {b.phone}. Correo: {b.email}.
      </p>
      <p>Al hacer un pedido aceptas estos términos y la <Link href="/privacidad">política de tratamiento de datos</Link>.</p>

      <h2>2. Productos y disponibilidad</h2>
      <ul>
        <li>Vendemos insumos para la elaboración de velas y otras creaciones artesanales, y velas hechas a mano.</li>
        <li>Las fotos son ilustrativas; los colores pueden variar según la pantalla y entre lotes de fabricación.</li>
        <li>Los pedidos están sujetos a disponibilidad del inventario. Si un producto se agota después de tu compra, te contactamos para cambiarlo o devolverte su valor.</li>
        <li>
          Los resultados de los insumos dependen de temperaturas, dosificaciones, compatibilidad entre materiales y procedimientos. Consulta la ficha de cada producto y
          las condiciones de uso en <Link href="/envios-y-devoluciones">envíos, cambios y garantías</Link>.
        </li>
      </ul>

      <h2>3. Precios</h2>
      <ul>
        <li>Los precios están en pesos colombianos (COP) y son el valor final del producto. Pueden cambiar sin previo aviso; siempre se respeta el precio que viste al confirmar tu pedido.</li>
        <li>
          El valor del domicilio en Barranquilla y Soledad depende de la zona de tu barrio y lo ves antes de pagar. Recoger en nuestro punto de entrega no tiene costo.
        </li>
        <li>
          <strong>Envíos al resto del país:</strong> el envío es <strong>flete al cobro</strong>. Su valor lo define la transportadora al generar la guía y lo pagas tú
          directamente a la transportadora al recibir; no está incluido en el total que pagas en la tienda.
        </li>
      </ul>

      <h2>4. Cómo se perfecciona la compra</h2>
      <ul>
        <li>
          <strong>Pago en línea:</strong> tu pedido queda confirmado cuando el pago es aprobado. Los pagos los procesa Wompi (tarjeta débito o crédito, PSE, Nequi y
          Botón Bancolombia); Lusarte no conoce ni almacena los datos de tu tarjeta.
        </li>
        <li>
          <strong>Pago contra entrega</strong> (solo Barranquilla y Soledad, previa coordinación): al enviarlo, te contactamos por WhatsApp para confirmarlo. El pedido
          queda confirmado cuando te lo confirmamos, y lo pagas al recibirlo, en efectivo o por transferencia.
        </li>
        <li>Te enviamos por correo la confirmación y un comprobante de tu compra. Guarda el enlace de tu pedido para consultar su estado.</li>
      </ul>

      <h2>5. Entregas</h2>
      <p>
        Los tiempos, zonas y condiciones de entrega están en <Link href="/envios-y-devoluciones">envíos, cambios y garantías</Link>. Los domicilios no tienen hora
        exacta: te informamos un tiempo estimado según nuestra ruta. Para envíos nacionales, el tiempo depende de la transportadora y el destino.
      </p>

      <h2>6. Derecho de retracto</h2>
      <p>
        Según el artículo 47 de la Ley 1480 de 2011 (Estatuto del Consumidor), puedes retractarte de una compra hecha en esta tienda dentro de los{" "}
        <strong>5 días hábiles</strong> siguientes a la entrega. Para hacerlo, escríbenos y devuelve el producto por tu cuenta, sin usar, en su empaque original y en las
        mismas condiciones en que lo recibiste; los costos de transporte de la devolución corren por tu cuenta. Te devolveremos el dinero pagado dentro de los 30 días
        calendario siguientes a la solicitud.
      </p>
      <p>
        No aplica para productos personalizados o hechos según tus especificaciones, ni para productos que por su naturaleza no puedan devolverse o se deterioren una vez
        abiertos (por ejemplo, fragancias, colorantes o ceras que hayan sido abiertos), como lo permite la misma norma.
      </p>

      <h2>7. Reversión del pago</h2>
      <p>
        Si pagaste con un medio de pago electrónico, puedes pedir la reversión del pago (artículo 51 de la Ley 1480 de 2011 y Decreto 587 de 2016) cuando fuiste objeto de
        fraude, la operación no fue solicitada, el producto no fue recibido, o no corresponde a lo pedido o tiene defectos. Debes presentar la queja ante Lusarte y
        avisar al emisor de tu medio de pago dentro de los 5 días hábiles siguientes a la fecha en que tuviste noticia del problema, y devolver el producto si lo
        recibiste.
      </p>

      <h2>8. Garantía, cambios y devoluciones</h2>
      <p>
        Atendemos la garantía legal de acuerdo con la Ley 1480 de 2011. Las condiciones de garantía, cambios voluntarios y novedades en la entrega están en{" "}
        <Link href="/envios-y-devoluciones">envíos, cambios y garantías</Link>.
      </p>

      <h2>9. Peticiones, quejas y reclamos</h2>
      <p>
        Escríbenos por <a href={whatsappUrl("¡Hola Lusarte! Tengo una petición, queja o reclamo sobre mi pedido.")}>WhatsApp al {b.phone}</a> o al correo {b.email}{" "}
        con el código de tu pedido. Respondemos dentro de los 15 días hábiles siguientes. Si no quedas conforme, puedes acudir a la Superintendencia de Industria y
        Comercio (www.sic.gov.co).
      </p>

      <h2>10. Ley aplicable</h2>
      <p>Estos términos se rigen por las leyes de la República de Colombia, en especial la Ley 1480 de 2011 y sus decretos reglamentarios.</p>
    </InfoPage>
  );
}
