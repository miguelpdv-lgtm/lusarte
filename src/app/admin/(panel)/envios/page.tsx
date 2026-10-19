import type { Metadata } from "next";
import Link from "next/link";
import { ShippingSettingsForm } from "@/components/admin/ShippingSettingsForm";
import { requireAdmin } from "@/lib/auth/session";
import { colombianHolidays, describeDay, formatDay, localDeliveryDate } from "@/lib/shop/calendar";
import { allBarrios } from "@/lib/shop/barrios";
import { departmentOptions } from "@/lib/shop/places";
import { getShippingSettings, scheduleOf } from "@/lib/shop/shipping";

export const metadata: Metadata = { title: "Envíos" };

export default async function EnviosAdmin() {
  await requireAdmin();
  const s = await getShippingSettings();
  const departments = departmentOptions();

  // Vista previa: qué se le promete hoy a un cliente local
  const next = localDeliveryDate(scheduleOf(s));
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Bogota" });
  const year = Number(today.slice(0, 4));
  const upcoming = [...colombianHolidays(year), ...colombianHolidays(year + 1)]
    .filter((d) => d >= today)
    .sort()
    .slice(0, 4)
    .map(formatDay);

  return (
    <div className="grid max-w-4xl grid-cols-1 gap-6">
      <Link href="/admin/pedidos" className="text-sm font-semibold underline-offset-4 hover:underline">
        ← Pedidos
      </Link>
      <div>
        <h1 className="font-display text-3xl font-extrabold">Envíos</h1>
        <p className="mt-1 text-sm text-carbon-suave">
          Si alguien en {s.local.cities.map((c) => c.name).join(" o ") || "una ciudad local"} compra ahora, le prometemos la entrega{" "}
          <strong>{describeDay(next)}</strong>. Envío nacional: flete al cobro.
        </p>
      </div>
      <ShippingSettingsForm
        departments={departments}
        upcomingHolidays={upcoming}
        barrios={allBarrios().map(({ id, name, city, lat, lng }) => ({ id, name, city, lat, lng }))}
        initial={{
          local: {
            cities: s.local.cities.map((c) => ({ departmentId: c.departmentId, city: c.name, price: c.price, cod: c.cod })),
            cutoff: s.local.cutoff,
            days: s.local.days,
            holidays: s.local.holidays,
            closedDates: s.local.closedDates.join("\n"),
            windows: s.local.windows.join("\n"),
            pickup: s.local.pickup,
            zones: s.local.zones.map((z) => ({ ...z, polygon: z.polygon.map(([a, b]) => [a, b] as [number, number]) })),
          },
        }}
      />
    </div>
  );
}
