import "server-only";
import { eq } from "drizzle-orm";
import { cache } from "react";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { describeDay, localDeliveryDate, type LocalSchedule } from "./calendar";

// Envíos configurables desde el panel (Panel → Envíos), guardados en settings["envios"]:
// - Ciudades locales (domicilio propio): tarifa por ciudad, contraentrega sí/no, horario con hora de corte,
//   y la opción de recoger en el punto de entrega (sin costo, previa coordinación).
// - Nacional: flete al cobro. La web no cobra el envío; el cliente se lo paga a la transportadora al recibir
//   (política de Lusarte: el valor se conoce cuando se genera la guía).

const KEY = "envios";

const ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const price = z.number().int().min(0).max(1_000_000);

export const shippingSettingsSchema = z.object({
  local: z.object({
    cities: z.array(z.object({ departmentId: z.number().int(), cityId: z.number().int(), name: z.string(), price, cod: z.boolean() })).max(50),
    cutoff: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    days: z.array(z.number().int().min(0).max(6)).max(7),
    holidays: z.boolean(),
    closedDates: z.array(ymd).max(200),
    /** Franjas de entrega para elegir al despachar */
    windows: z.array(z.string().trim().min(1).max(60)).max(12),
    /** Recoger en el punto de entrega (ciudades locales), sin costo */
    pickup: z.object({ enabled: z.boolean(), note: z.string().trim().max(200) }).default({ enabled: true, note: "" }),
  }),
});

export type ShippingSettings = z.infer<typeof shippingSettingsSchema>;

/** Valores iniciales. TODO(clienta): confirmar las tarifas (las de ahora son provisionales). */
function defaults(): ShippingSettings {
  return {
    local: {
      cities: [
        { departmentId: 778, cityId: 12666, name: "Barranquilla", price: 8000, cod: true },
        { departmentId: 778, cityId: 12684, name: "Soledad", price: 8000, cod: true },
      ],
      cutoff: "14:00",
      days: [1, 2, 3, 4, 5, 6],
      holidays: true,
      closedDates: [],
      windows: ["Mañana (9 a. m. – 12 m.)", "Tarde (2 – 6 p. m.)", "Noche (6 – 8 p. m.)"],
      pickup: { enabled: true, note: "Te escribimos por WhatsApp para coordinar el lugar y la hora." },
    },
  };
}

export const getShippingSettings = cache(async (): Promise<ShippingSettings> => {
  try {
    const [row] = await db.select().from(schema.settings).where(eq(schema.settings.key, KEY)).limit(1);
    if (row) {
      const parsed = shippingSettingsSchema.safeParse(JSON.parse(row.value));
      if (parsed.success) return parsed.data;
    }
  } catch {
    // Sin la tabla todavía (antes de migrar) o JSON dañado: valores por defecto
  }
  return defaults();
});

export async function saveShippingSettings(value: ShippingSettings) {
  const json = JSON.stringify(shippingSettingsSchema.parse(value));
  await db.insert(schema.settings).values({ key: KEY, value: json }).onDuplicateKeyUpdate({ set: { value: json } });
}

export const scheduleOf = (s: ShippingSettings): LocalSchedule => s.local;

export type Delivery = "domicilio" | "recoger" | "nacional";

export type DeliveryOption = {
  delivery: Delivery;
  zone: "local" | "nacional";
  /** Lo que se cobra en la web por el envío (nacional y recoger: 0) */
  price: number;
  /** Se puede pagar al recibir */
  cod: boolean;
  /** Fecha programada si se confirma ahora (domicilio y recoger) */
  scheduledFor: string | null;
  title: string;
  /** Texto para el cliente */
  estimate: string;
};

/** Opciones de entrega para un municipio (id de Effi): domicilio y recoger en las ciudades locales; nacional en las demás. */
export async function deliveryOptions(cityId: number, now = new Date()): Promise<DeliveryOption[]> {
  const s = await getShippingSettings();
  const local = s.local.cities.find((c) => c.cityId === cityId);
  if (!local) {
    return [
      {
        delivery: "nacional",
        zone: "nacional",
        price: 0,
        cod: false,
        scheduledFor: null,
        title: "Envío nacional · flete al cobro",
        estimate: "Despachamos en 1 a 3 días hábiles por transportadora. El valor del envío lo pagas a la transportadora al recibir.",
      },
    ];
  }
  const day = localDeliveryDate(scheduleOf(s), now);
  const options: DeliveryOption[] = [
    {
      delivery: "domicilio",
      zone: "local",
      price: local.price,
      cod: local.cod,
      scheduledFor: day,
      title: `Domicilio Lusarte en ${local.name}`,
      estimate: `Te lo llevamos ${describeDay(day, now)}, según nuestra ruta. Te avisamos el tiempo estimado.`,
    },
  ];
  if (s.local.pickup.enabled)
    options.push({
      delivery: "recoger",
      zone: "local",
      price: 0,
      cod: local.cod,
      scheduledFor: day,
      title: "Recoger en nuestro punto de entrega",
      estimate: `Listo para recoger ${describeDay(day, now)}. ${s.local.pickup.note}`.trim(),
    });
  return options;
}

/** Datos para mostrar antes de saber la ciudad. */
export async function shippingRange() {
  const s = await getShippingSettings();
  return { localNames: s.local.cities.map((c) => c.name), localMin: Math.min(...s.local.cities.map((c) => c.price), Infinity) };
}
