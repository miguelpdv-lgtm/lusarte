import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage } from "@/components/store/InfoPage";
import { formatCOP } from "@/lib/format";
import { ONLINE_FEE, onlineFeeRate } from "@/lib/shop/fees";
import { getShippingSettings } from "@/lib/shop/shipping";
import { whatsappUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Cómo comprar",
  description: "Compra en línea en Lusarte o por WhatsApp: elige tus insumos, paga en línea o contra entrega en Barranquilla y Soledad, y recibe tu pedido.",
  alternates: { canonical: "/como-comprar" },
};

// "Proceso de compra" enviado por Lusarte (2026-10-19), con la compra en línea como primer camino.
export const dynamic = "force-dynamic";

const listJoin = (items: string[]) => (items.length <= 1 ? (items[0] ?? "") : `${items.slice(0, -1).join(", ")} y ${items.at(-1)}`);

export default async function ComoComprarPage() {
  const s = await getShippingSettings();
  const local = listJoin(s.local.cities.map((c) => c.name)) || "Barranquilla y Soledad";
  const cod = listJoin(s.local.cities.filter((c) => c.cod).map((c) => c.name));

  return (
    <InfoPage title="¿Cómo realizar tu compra?" intro="¡Nos encanta ser parte de tus creaciones! Puedes comprar aquí en la tienda o por WhatsApp.">
      <h2>En la tienda en línea</h2>
      <h3 className="-mb-3 font-bold">1. Selecciona tus productos</h3>
      <p>
        Explora nuestro <Link href="/tienda">catálogo</Link>, elige la presentación y la cantidad, y agrégalos al carrito. Los precios y la disponibilidad que ves son los
        de nuestro inventario.
      </p>
      <h3 className="-mb-3 font-bold">2. Elige cómo recibirlo</h3>
      <p>
        Al pagar, escribe tu ciudad y elige: domicilio Lusarte o recoger en nuestro punto de entrega (en {local}), o envío nacional por transportadora con flete al cobro
        al resto del país. Detalles en <Link href="/envios-y-devoluciones">envíos, cambios y garantías</Link>.
      </p>
      <h3 className="-mb-3 font-bold">3. Elige tu método de pago</h3>
      <p>
        Paga en línea con tarjeta, PSE, Nequi o Bancolombia a través de Wompi. Desde {formatCOP(ONLINE_FEE.threshold)}, el pago en línea suma la comisión de Wompi (
        {onlineFeeRate()}). Si eres de otra ciudad y prefieres pagar por transferencia, escríbenos por WhatsApp.
        {cod && ` En ${cod} también puedes pagar contra entrega, previa coordinación: te escribimos por WhatsApp para confirmar tu pedido.`}
      </p>
      <h3 className="-mb-3 font-bold">4. Recibe tu pedido</h3>
      <p>Te enviamos un correo con la confirmación y el comprobante, y otro cuando tu pedido salga, con la guía o el tiempo estimado de entrega.</p>

      <h2>Por WhatsApp</h2>
      <ol className="list-decimal pl-5">
        <li>
          <strong>Selecciona tus productos:</strong> envíanos por <a href={whatsappUrl()}>WhatsApp</a> los nombres y cantidades de los productos que deseas.
        </li>
        <li>
          <strong>Confirma tu cotización:</strong> verificamos los precios y la disponibilidad. Una vez recibas tu cotización, podrás confirmar tu pedido.
        </li>
        <li>
          <strong>Elige tu método de pago:</strong> aceptamos transferencias bancarias y pagos contra entrega, estos últimos disponibles únicamente para {cod || local}, previa
          coordinación.
        </li>
        <li>
          <strong>Coordina la entrega:</strong> puedes solicitar un domicilio, envío nacional o recoger tu pedido en nuestro lugar de entrega, previa coordinación.
        </li>
      </ol>

      <p>
        <strong>Importante:</strong> los pedidos están sujetos a disponibilidad. La preparación y entrega se coordinan una vez confirmado el pedido y las condiciones de pago.
      </p>
      <p className="font-hand text-2xl">¡Gracias por elegirnos para darle vida a tus ideas!</p>
    </InfoPage>
  );
}
