import "server-only";
import { eq } from "drizzle-orm";
import { cache } from "react";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { allBarrios, convexHull, findBarrio, hasBarrios, inflate, inPolygon, type Barrio, type LatLng } from "./barrios";
import { describeDay, localDeliveryDate, type LocalSchedule } from "./calendar";
import soledad from "@/data/zonas-soledad.json";

// Envíos configurables desde el panel (Panel → Envíos), guardados en settings["envios"]:
// - Ciudades locales (domicilio propio): contraentrega sí/no, horario con hora de corte, y la opción de recoger en el
//   punto de entrega (sin costo, previa coordinación). En Barranquilla y Soledad el domicilio se cobra por ZONAS: la
//   dueña las dibuja en el mapa con su tarifa y el comprador elige su barrio (src/lib/shop/barrios.ts); en las demás
//   ciudades locales, con la tarifa de la ciudad.
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
    /** Zonas de domicilio (Barranquilla y Soledad). Si un barrio cae en varias, manda la primera de la lista. */
    zones: z
      .array(
        z.object({
          id: z.string().max(40),
          name: z.string().trim().min(1).max(60),
          color: z.string().regex(/^#[0-9a-f]{6}$/i),
          price,
          cod: z.boolean(),
          polygon: z.array(z.tuple([z.number().min(-90).max(90), z.number().min(-180).max(180)])).min(3).max(500),
        }),
      )
      .max(40)
      .default(() => initialZones()),
  }),
});

export type Zone = ShippingSettings["local"]["zones"][number];

const ZONE_COLORS = ["#9a7aae", "#8aa9c1", "#aaa96c", "#d39a5b", "#c46b7c", "#5b8f7a", "#c9b458", "#7c6fc4"];

/**
 * Zonas iniciales. Soledad: las 5 zonas de la lista de Lusarte (src/data/zonas-soledad.json, de scripts/zonas-soledad.py),
 * primero porque las envolventes de Barranquilla se meten en Soledad. Barranquilla: una por localidad oficial.
 * Son un punto de partida: la dueña las redibuja y les pone su tarifa en Panel → Envíos.
 */
export function initialZones() {
  const sol = soledad.zones.map((z, i) => ({
    id: `soledad-${i + 1}`,
    name: z.name,
    color: z.color,
    price: z.price,
    cod: true,
    polygon: z.polygon as LatLng[],
  }));
  const groups = new Map<string, LatLng[]>();
  for (const b of allBarrios()) {
    if (b.city === "Soledad") continue;
    const area = b.area?.split(",")[0]?.trim().replace(/^Suroriental$/, "Suroriente");
    if (!area) continue;
    groups.set(area, [...(groups.get(area) ?? []), [b.lat, b.lng]]);
  }
  // Última: el resto de Barranquilla (afueras), para que ningún barrio de la ciudad quede sin tarifa
  groups.set(
    "Resto de Barranquilla",
    allBarrios()
      .filter((b) => b.city === "Barranquilla")
      .map((b) => [b.lat, b.lng] as LatLng),
  );
  const order = ["Riomar", "Norte - Centro Historico", "Suroccidente", "Suroriente", "Metropolitana", "Resto de Barranquilla"];
  const baq = order
    .filter((name) => (groups.get(name)?.length ?? 0) >= 3)
    .map((name, i) => ({
      id: `zona-${i + 1}`,
      name: name === "Norte - Centro Historico" ? "Norte - Centro Histórico" : name,
      color: ZONE_COLORS[i % ZONE_COLORS.length],
      price: name === "Resto de Barranquilla" ? 12000 : 8000,
      cod: true,
      polygon: inflate(convexHull(groups.get(name)!)).map(([la, ln]) => [Math.round(la * 1e6) / 1e6, Math.round(ln * 1e6) / 1e6] as LatLng),
    }));
  return [...sol, ...baq];
}

/** Zona de un barrio (la primera que lo contiene) o null. */
export function zoneForBarrio(b: Pick<Barrio, "lat" | "lng">, zones: Zone[]) {
  return zones.find((z) => inPolygon([b.lat, b.lng], z.polygon as LatLng[])) ?? null;
}

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
      zones: initialZones(),
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
  /** false: la opción se muestra pero no se puede elegir todavía (falta el barrio o está fuera de zona) */
  available: boolean;
  /** El municipio cobra el domicilio por barrio/zona */
  needsBarrio?: boolean;
  zoneName?: string | null;
};

/**
 * Opciones de entrega para un municipio (id de Effi): domicilio y recoger en las ciudades locales; nacional en las demás.
 * En Barranquilla y Soledad el domicilio depende del barrio (barrioId): su zona define la tarifa y la contraentrega.
 */
export async function deliveryOptions(cityId: number, barrioId: number | null = null, now = new Date()): Promise<DeliveryOption[]> {
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
        available: true,
      },
    ];
  }
  const day = localDeliveryDate(scheduleOf(s), now);
  const when = `Te lo llevamos ${describeDay(day, now)}, según nuestra ruta. Te avisamos el tiempo estimado.`;
  const options: DeliveryOption[] = [];
  if (hasBarrios(local.name)) {
    const barrio = barrioId ? findBarrio(barrioId) : null;
    const valid = barrio && barrio.city.toLowerCase() === local.name.toLowerCase() ? barrio : null;
    const zone = valid ? zoneForBarrio(valid, s.local.zones) : null;
    options.push(
      !valid
        ? { delivery: "domicilio", zone: "local", price: 0, cod: false, scheduledFor: day, title: "Domicilio Lusarte", estimate: "Elige tu barrio para ver el valor del domicilio.", available: false, needsBarrio: true }
        : zone
          ? { delivery: "domicilio", zone: "local", price: zone.price, cod: local.cod && zone.cod, scheduledFor: day, title: `Domicilio Lusarte · ${valid.name}`, estimate: when, available: true, needsBarrio: true, zoneName: zone.name }
          : {
              delivery: "domicilio",
              zone: "local",
              price: 0,
              cod: false,
              scheduledFor: day,
              title: `Domicilio Lusarte · ${valid.name}`,
              estimate: "Tu barrio está fuera de nuestras zonas de domicilio: elige recoger o escríbenos por WhatsApp para cotizarlo.",
              available: false,
              needsBarrio: true,
            },
    );
  } else {
    options.push({ delivery: "domicilio", zone: "local", price: local.price, cod: local.cod, scheduledFor: day, title: `Domicilio Lusarte en ${local.name}`, estimate: when, available: true });
  }
  if (s.local.pickup.enabled)
    options.push({
      delivery: "recoger",
      zone: "local",
      price: 0,
      cod: local.cod,
      scheduledFor: day,
      title: "Recoger en nuestro punto de entrega",
      estimate: `Listo para recoger ${describeDay(day, now)}. ${s.local.pickup.note}`.trim(),
      available: true,
    });
  return options;
}

/** Datos para mostrar antes de saber la ciudad. */
export async function shippingRange() {
  const s = await getShippingSettings();
  return { localNames: s.local.cities.map((c) => c.name), localMin: Math.min(...s.local.cities.map((c) => c.price), Infinity) };
}
