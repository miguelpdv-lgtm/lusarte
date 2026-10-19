"use client";

import { useActionState, useEffect, useState, type ReactNode } from "react";
import { citiesFor } from "@/app/(sitio)/checkout-actions";
import { saveShippingAction, type ShippingForm, type ShippingFormState } from "@/app/admin/shipping-actions";
import { inputClass } from "./Field";

type Dept = { id: number; name: string };

const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="toon grid gap-4 rounded-[1.25rem] bg-crema-claro p-5">
      <div>
        <h2 className="font-display text-lg font-extrabold">{title}</h2>
        {hint && <p className="text-sm text-carbon-suave">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

/** Municipios del departamento para autocompletar (uno por departamento, se cargan al elegirlo). */
function CityInput({ departmentId, value, onChange, placeholder, invalid }: { departmentId: number; value: string; onChange: (v: string) => void; placeholder?: string; invalid?: boolean }) {
  const [list, setList] = useState<string[]>([]);
  useEffect(() => {
    if (!departmentId) return;
    let alive = true;
    citiesFor(departmentId).then((l) => alive && setList(l));
    return () => {
      alive = false;
    };
  }, [departmentId]);
  const id = `municipios-${departmentId}`;
  return (
    <>
      <input list={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-invalid={invalid} className={`${inputClass} aria-invalid:border-alerta`} />
      <datalist id={id}>
        {list.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
    </>
  );
}

function DeptSelect({ departments, value, onChange }: { departments: Dept[]; value: number; onChange: (v: number) => void }) {
  return (
    <select value={value || ""} onChange={(e) => onChange(Number(e.target.value))} className={inputClass}>
      <option value="" disabled>
        Departamento…
      </option>
      {departments.map((d) => (
        <option key={d.id} value={d.id}>
          {d.name}
        </option>
      ))}
    </select>
  );
}

const money = "w-full rounded-xl border-2 border-carbon/80 bg-white px-3 py-2.5 text-right tabular-nums outline-none focus:shadow-[3px_3px_0_var(--color-carbon)]";

export function ShippingSettingsForm({ initial, departments, upcomingHolidays }: { initial: ShippingForm; departments: Dept[]; upcomingHolidays: string[] }) {
  const [data, setData] = useState<ShippingForm>(initial);
  const [state, action, pending] = useActionState<ShippingFormState, FormData>(saveShippingAction, {});
  const rowErr = state.rowErrors ?? {};

  const setLocal = (patch: Partial<ShippingForm["local"]>) => setData((d) => ({ ...d, local: { ...d.local, ...patch } }));
  const editCity = (i: number, patch: Partial<ShippingForm["local"]["cities"][number]>) =>
    setLocal({ cities: data.local.cities.map((c, k) => (k === i ? { ...c, ...patch } : c)) });

  return (
    <form action={action} className="grid gap-6">
      <input type="hidden" name="data" value={JSON.stringify(data)} />

      <Section title="Ciudades con domicilio Lusarte" hint="Entrega propia (no transportadora). Aquí se elige la franja al despachar y se puede ofrecer pago contraentrega.">
        <div className="grid gap-3">
          {data.local.cities.map((c, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-[1fr_1fr_8rem_auto_auto] sm:items-center">
              <DeptSelect departments={departments} value={c.departmentId} onChange={(v) => editCity(i, { departmentId: v, city: "" })} />
              <CityInput departmentId={c.departmentId} value={c.city} onChange={(v) => editCity(i, { city: v })} placeholder="Municipio" invalid={!!rowErr[`local-${i}`]} />
              <input type="number" min={0} step={500} value={c.price} onChange={(e) => editCity(i, { price: Number(e.target.value) })} aria-label="Tarifa" className={money} />
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input type="checkbox" checked={c.cod} onChange={(e) => editCity(i, { cod: e.target.checked })} className="size-4 accent-carbon" /> Contraentrega
              </label>
              <button type="button" onClick={() => setLocal({ cities: data.local.cities.filter((_, k) => k !== i) })} className="cursor-pointer text-sm font-semibold text-alerta">
                Quitar
              </button>
              {rowErr[`local-${i}`] && <p className="text-xs font-bold text-alerta sm:col-span-5">{rowErr[`local-${i}`]}</p>}
            </div>
          ))}
          <button
            type="button"
            onClick={() => setLocal({ cities: [...data.local.cities, { departmentId: 778, city: "", price: data.local.cities[0]?.price ?? 0, cod: true }] })}
            className="cursor-pointer justify-self-start text-sm font-bold underline-offset-4 hover:underline"
          >
            + Agregar ciudad
          </button>
        </div>
      </Section>

      <Section title="Horario de entrega local" hint="Lo que se confirma antes de la hora de corte, en un día de entrega, se entrega ese mismo día; lo demás, el siguiente día de entrega.">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5">
            <span className="text-sm font-bold">Hora de corte</span>
            <input type="time" value={data.local.cutoff} onChange={(e) => setLocal({ cutoff: e.target.value })} className={inputClass} />
          </label>
          <fieldset className="grid gap-1.5">
            <legend className="text-sm font-bold">Días de entrega</legend>
            <div className="flex flex-wrap gap-1.5 pt-1.5">
              {DAYS.map((d, i) => {
                const on = data.local.days.includes(i);
                return (
                  <label key={d} className={`cursor-pointer rounded-full border-2 px-3 py-1.5 text-sm font-bold ${on ? "border-carbon bg-carbon text-crema" : "border-carbon/30"}`}>
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => setLocal({ days: on ? data.local.days.filter((x) => x !== i) : [...data.local.days, i] })}
                      className="sr-only"
                    />
                    {d}
                  </label>
                );
              })}
            </div>
          </fieldset>
          <label className="flex items-start gap-2 text-sm sm:col-span-2">
            <input type="checkbox" checked={data.local.holidays} onChange={(e) => setLocal({ holidays: e.target.checked })} className="mt-1 size-4 accent-carbon" />
            <span>
              <strong>No entregar en festivos de Colombia</strong> (se calculan solos).
              {upcomingHolidays.length > 0 && <span className="block text-carbon-suave">Próximos: {upcomingHolidays.join(" · ")}</span>}
            </span>
          </label>
          <label className="grid gap-1.5">
            <span className="text-sm font-bold">Otras fechas sin entrega</span>
            <textarea
              rows={4}
              value={data.local.closedDates}
              onChange={(e) => setLocal({ closedDates: e.target.value })}
              placeholder={"2026-12-24\n2026-12-31"}
              className={`${inputClass} font-mono text-sm`}
            />
            <span className="text-xs text-carbon-suave">Una por línea, AAAA-MM-DD (vacaciones, cierres).</span>
          </label>
          <label className="grid gap-1.5">
            <span className="text-sm font-bold">Franjas de entrega</span>
            <textarea rows={4} value={data.local.windows} onChange={(e) => setLocal({ windows: e.target.value })} className={`${inputClass} text-sm`} />
            <span className="text-xs text-carbon-suave">Una por línea. Se eligen al despachar y le llegan al cliente.</span>
          </label>
        </div>
      </Section>

      <Section title="Recoger en el punto de entrega" hint="Sin costo, para las ciudades de domicilio. El cliente lo coordina por WhatsApp.">
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            checked={data.local.pickup.enabled}
            onChange={(e) => setLocal({ pickup: { ...data.local.pickup, enabled: e.target.checked } })}
            className="size-4 accent-carbon"
          />
          Ofrecer &ldquo;Recoger en nuestro punto de entrega&rdquo; en el checkout
        </label>
        <label className="grid gap-1.5">
          <span className="text-sm font-bold">Indicaciones para el cliente</span>
          <input
            maxLength={200}
            value={data.local.pickup.note}
            onChange={(e) => setLocal({ pickup: { ...data.local.pickup, note: e.target.value } })}
            className={inputClass}
          />
          <span className="text-xs text-carbon-suave">No pongas la dirección exacta si prefieres darla por WhatsApp.</span>
        </label>
      </Section>

      <Section title="Envío nacional" hint="Al resto del país, por transportadora, con flete al cobro: la tienda no cobra el envío y el cliente se lo paga a la transportadora al recibir.">
        <p className="text-sm">No hay nada que configurar aquí.</p>
      </Section>

      <div className="sticky bottom-4 flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className="toon toon-press cursor-pointer rounded-full bg-estrella px-6 py-3 text-sm font-bold disabled:cursor-wait disabled:opacity-60">
          {pending ? "Guardando…" : "Guardar cambios"}
        </button>
        {state.ok && (
          <p role="status" className="rounded-full bg-oliva/50 px-3 py-1 text-sm font-bold">
            ✓ Guardado
          </p>
        )}
        {state.error && (
          <p role="alert" className="rounded-full bg-white px-3 py-1 text-sm font-bold text-alerta">
            {state.error}
          </p>
        )}
      </div>
    </form>
  );
}
