"use client";

import { useActionState } from "react";
import { ship, type ShipState } from "@/app/admin/order-actions";
import { Field, inputClass } from "./Field";

type Props = {
  code: string;
  carriers: string[];
  shipped: boolean;
  initial: { carrier: string | null; trackingNumber: string | null; trackingUrl: string | null; shippingNote: string | null };
};

/** Despachar el pedido, o corregir la guía si ya salió. */
export function ShipForm({ code, carriers, shipped, initial }: Props) {
  const [state, action, pending] = useActionState<ShipState, FormData>(ship.bind(null, code), {});
  const f = state.fields ?? {};
  const err = (key: string, fallback?: string) => (f[key] ? <span className="font-bold text-alerta">{f[key]}</span> : fallback);

  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <Field label="Transportadora" hint={err("carrier", "Servientrega, Interrapidísimo, Coordinadora…")}>
        <input name="carrier" list="transportadoras" required defaultValue={initial.carrier ?? ""} aria-invalid={!!f.carrier} className={inputClass} />
        <datalist id="transportadoras">
          {carriers.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </Field>
      <Field label="Número de guía" hint={err("trackingNumber")}>
        <input name="trackingNumber" required defaultValue={initial.trackingNumber ?? ""} aria-invalid={!!f.trackingNumber} className={inputClass} />
      </Field>
      <Field label="Link de rastreo (opcional)" hint={err("trackingUrl", "Si lo pones, el correo trae un botón para rastrear.")} className="sm:col-span-2">
        <input name="trackingUrl" type="url" inputMode="url" defaultValue={initial.trackingUrl ?? ""} aria-invalid={!!f.trackingUrl} placeholder="https://" className={inputClass} />
      </Field>
      <Field label="Nota para el cliente (opcional)" hint={err("shippingNote")} className="sm:col-span-2">
        <textarea name="shippingNote" rows={2} maxLength={500} defaultValue={initial.shippingNote ?? ""} className={inputClass} />
      </Field>

      {shipped && (
        <label className="flex items-center gap-2 text-sm font-semibold sm:col-span-2">
          <input type="checkbox" name="notify" className="size-4 accent-carbon" /> Enviar de nuevo el correo con la guía al cliente
        </label>
      )}

      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="toon toon-press cursor-pointer rounded-full bg-estrella px-6 py-2.5 text-sm font-bold disabled:cursor-wait disabled:opacity-60"
        >
          {pending ? "Guardando…" : shipped ? "Guardar cambios" : "Despachar y avisar al cliente"}
        </button>
        {state.ok && (
          <p role="status" className="text-sm font-bold">
            ✓ {state.ok}
          </p>
        )}
        {state.error && (
          <p role="alert" className="text-sm font-bold text-alerta">
            {state.error}
          </p>
        )}
      </div>
    </form>
  );
}
