"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { findCity, findDepartment } from "@/lib/shop/places";
import { saveShippingSettings, shippingSettingsSchema, type ShippingSettings } from "@/lib/shop/shipping";

/** Lo que manda el formulario: municipios por nombre (se resuelven a ids de Effi aquí). */
export type ShippingForm = {
  local: {
    cities: { departmentId: number; city: string; price: number; cod: boolean }[];
    cutoff: string;
    days: number[];
    holidays: boolean;
    closedDates: string;
    windows: string;
    pickup: { enabled: boolean; note: string };
  };
};

export type ShippingFormState = { ok?: boolean; error?: string; rowErrors?: Record<string, string> };

const lines = (s: string) =>
  s
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

export async function saveShippingAction(_prev: ShippingFormState, form: FormData): Promise<ShippingFormState> {
  await requireAdmin();
  let data: ShippingForm;
  try {
    data = JSON.parse(String(form.get("data") ?? ""));
  } catch {
    return { error: "No se pudo leer el formulario. Recarga la página." };
  }

  const rowErrors: Record<string, string> = {};
  const localCities = data.local.cities.map((c, i) => {
    const dept = findDepartment(Number(c.departmentId));
    const place = dept ? findCity(dept.id, c.city) : null;
    if (!place) rowErrors[`local-${i}`] = "Elige un municipio de la lista";
    return { departmentId: dept?.id ?? 0, cityId: place?.id ?? 0, name: place?.name ?? c.city, price: Math.round(Number(c.price) || 0), cod: !!c.cod };
  });
  const closedDates = lines(data.local.closedDates);
  const badDate = closedDates.find((d) => !/^\d{4}-\d{2}-\d{2}$/.test(d));
  if (badDate) return { error: `Fecha cerrada inválida: "${badDate}". Usa el formato AAAA-MM-DD, una por línea.`, rowErrors };
  if (new Set(localCities.map((c) => c.cityId)).size !== localCities.length) return { error: "Hay una ciudad local repetida.", rowErrors };
  if (Object.keys(rowErrors).length) return { error: "Revisa las filas marcadas.", rowErrors };

  const parsed = shippingSettingsSchema.safeParse({
    local: {
      cities: localCities,
      cutoff: data.local.cutoff,
      days: [...new Set(data.local.days)].sort(),
      holidays: !!data.local.holidays,
      closedDates,
      windows: lines(data.local.windows),
      pickup: { enabled: !!data.local.pickup.enabled, note: String(data.local.pickup.note ?? "").trim().slice(0, 200) },
    },
  } satisfies ShippingSettings);
  if (!parsed.success) return { error: `Revisa los valores: ${parsed.error.issues[0]?.message ?? "dato inválido"}` };
  if (parsed.data.local.days.length === 0) return { error: "Elige al menos un día de entrega local." };
  if (parsed.data.local.windows.length === 0) return { error: "Escribe al menos una franja de entrega." };

  await saveShippingSettings(parsed.data);
  revalidatePath("/admin/envios");
  return { ok: true };
}
