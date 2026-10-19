import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage } from "@/components/store/InfoPage";
import { formatCOP } from "@/lib/format";
import { formatDay } from "@/lib/shop/calendar";
import { getShippingSettings } from "@/lib/shop/shipping";
import { whatsappUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Envíos, cambios y garantías",
  description:
    "Domicilios en Barranquilla y Soledad, envíos nacionales con flete al cobro, recogida previa coordinación, y la política de cambios, devoluciones y garantías de Lusarte.",
  alternates: { canonical: "/envios-y-devoluciones" },
};

// Políticas enviadas por Lusarte (2026-10-19), adaptadas a la compra en línea. Las ciudades, tarifas y horarios
// de domicilio salen de Panel → Envíos.
export const dynamic = "force-dynamic";

const DAY_NAMES = ["domingos", "lunes", "martes", "miércoles", "jueves", "viernes", "sábados"];
const listJoin = (items: string[]) => (items.length <= 1 ? (items[0] ?? "") : `${items.slice(0, -1).join(", ")} y ${items.at(-1)}`);
function hour(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return `${h % 12 === 0 ? 12 : h % 12}${m ? `:${String(m).padStart(2, "0")}` : ""} ${h < 12 ? "a. m." : "p. m."}`;
}

export default async function EnviosPage() {
  const s = await getShippingSettings();
  const cities = s.local.cities;
  const names = listJoin(cities.map((c) => c.name)) || "Barranquilla y Soledad";
  const codCities = cities.filter((c) => c.cod).map((c) => c.name);
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Bogota" });
  const closed = s.local.closedDates.filter((d) => d >= today).slice(0, 5);

  return (
    <InfoPage title="Envíos, cambios y garantías" intro="Queremos que tus insumos lleguen a tus manos de la mejor manera, y que compres con confianza.">
      <h2>Envíos y entregas</h2>

      <h3 className="-mb-3 font-bold">1. Domicilios locales</h3>
      <p>
        Realizamos entregas en {names}, sujetas a disponibilidad y programación de rutas.
        {cities.length > 0 && ` El domicilio cuesta ${listJoin(cities.map((c) => `${formatCOP(c.price)} en ${c.name}`))} y lo ves antes de pagar.`}
      </p>
      <p>
        Si confirmas tu pedido antes de las {hour(s.local.cutoff)}, lo programamos para el mismo día; si no, para el siguiente día de entrega. Entregamos los{" "}
        {listJoin(s.local.days.map((d) => DAY_NAMES[d]))}
        {s.local.holidays && ", excepto festivos"}.{closed.length > 0 && ` No haremos entregas el ${listJoin(closed.map(formatDay))}.`}
      </p>

      <h3 className="-mb-3 font-bold">2. Envíos nacionales</h3>
      <p>Realizamos envíos a otras ciudades de Colombia por transportadora. Los tiempos de entrega dependen de la transportadora y el destino. Despachamos en 1 a 3 días hábiles después de confirmado el pago, y te enviamos por correo la transportadora y el número de guía.</p>

      <h3 className="-mb-3 font-bold">3. Costos de envío</h3>
      <p>El valor del domicilio o del envío lo asume el cliente.</p>
      <ul>
        <li>
          <strong>Envíos nacionales:</strong> el valor se genera cuando la transportadora recibe el paquete y genera la guía. Por eso es <strong>flete al cobro</strong>: no lo
          pagas en la tienda, se lo pagas a la transportadora al recibir.
        </li>
        <li>
          <strong>Domicilios en {names}:</strong> el valor se establece antes de enviar el pedido y lo ves en el pago.
        </li>
      </ul>

      <h3 className="-mb-3 font-bold">4. Horarios de entrega</h3>
      <p>Los domicilios no tienen una hora exacta de entrega. Te informaremos un tiempo estimado según la disponibilidad de nuestra ruta.</p>

      <h3 className="-mb-3 font-bold">5. Recogida de pedidos</h3>
      <p>
        No contamos con punto de venta físico, pero puedes recoger tu pedido en nuestro lugar de entrega, previa coordinación y confirmación de disponibilidad.
        {s.local.pickup.enabled && " Elige “Recoger en nuestro punto de entrega” al pagar y te escribimos por WhatsApp para coordinar."}
      </p>

      <h3 className="-mb-3 font-bold">6. Pago contra entrega</h3>
      <p>
        {codCities.length > 0
          ? `Disponible únicamente para ${listJoin(codCities)}, previa coordinación: al elegirlo, te escribimos por WhatsApp para confirmar tu pedido antes de prepararlo. Pagas al recibir, en efectivo o por transferencia.`
          : "Por ahora no está disponible."}
      </p>

      <h3 className="-mb-3 font-bold">7. Novedades en la entrega</h3>
      <p>
        Si tu pedido llega con daños, derrames o productos faltantes, <a href={whatsappUrl("¡Hola Lusarte! Tuve una novedad con la entrega de mi pedido.")}>contáctanos</a> lo antes
        posible para revisar lo ocurrido y ofrecerte una solución.
      </p>

      <h2>Cambios, devoluciones y garantías</h2>

      <h3 className="-mb-3 font-bold">1. Productos defectuosos o dañados</h3>
      <p>Si recibes un producto con defectos de fabricación, daños ocasionados por el empaque, derrames o alguna irregularidad, comunícate con nosotros lo antes posible.</p>
      <p>Puedes enviarnos fotografías y una descripción de lo ocurrido para facilitar la revisión. Atenderemos las solicitudes de acuerdo con la garantía legal aplicable.</p>

      <h3 className="-mb-3 font-bold">2. Uso adecuado de los insumos</h3>
      <p>Nuestros productos están destinados a la elaboración de velas y otras creaciones artesanales, según sus características técnicas.</p>
      <p>Los resultados pueden variar dependiendo de factores como las temperaturas de trabajo, dosificaciones, compatibilidad entre materiales y procedimientos utilizados.</p>
      <p>
        No asumimos responsabilidad por resultados insatisfactorios derivados de una manipulación incorrecta, formulaciones inadecuadas o usos contrarios a las instrucciones
        suministradas, cuando se compruebe que estas circunstancias causaron el problema.
      </p>

      <h3 className="-mb-3 font-bold">3. Cambios voluntarios</h3>
      <p>Los cambios por preferencia personal, como solicitar otra referencia, presentación o fragancia, estarán sujetos a evaluación y aceptación previa.</p>
      <p>Para que un cambio voluntario sea aceptado, el producto deberá encontrarse completamente sellado, sin usar, en su empaque original y en las mismas condiciones en que fue entregado.</p>
      <p>Cuando se autorice un cambio voluntario, el cliente asumirá los costos de transporte correspondientes a la devolución del producto y al envío del nuevo.</p>

      <h3 className="-mb-3 font-bold">4. Garantías</h3>
      <p>Cuando se confirme un defecto cubierto por la garantía legal, ofreceremos la solución que corresponda según la normativa vigente, sin trasladar al cliente los costos necesarios para hacer efectiva la garantía.</p>
      <p>Las solicitudes de garantía no estarán condicionadas a que el producto permanezca sellado o sin utilizar, siempre que se cumplan las condiciones legales aplicables.</p>
      <p>
        También puedes ejercer el derecho de retracto en los términos de la Ley 1480 de 2011. Más detalles en los <Link href="/terminos">términos y condiciones</Link>.
      </p>

      <p className="font-hand text-2xl">Preparamos cada pedido con dedicación para acompañar tus creaciones.</p>
    </InfoPage>
  );
}
