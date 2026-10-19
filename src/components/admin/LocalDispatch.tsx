"use client";

import { useActionState, useState } from "react";
import { cancelCodAction, shipLocalAction, type LocalState } from "@/app/admin/order-actions";
import { Field, inputClass } from "./Field";

type Props = {
  code: string;
  /** Recoger en el punto de entrega: se avisa que está listo y cuándo */
  pickup?: boolean;
  windows: string[];
  shipped: boolean;
  initial: { window: string | null; note: string | null };
};

/** Despacho local: franja de entrega para el domiciliario; el cliente recibe la franja por correo. */
export function LocalDispatch({ code, pickup = false, windows, shipped, initial }: Props) {
  const [state, action, pending] = useActionState<LocalState, FormData>(shipLocalAction.bind(null, code), {});
  const preset = initial.window && windows.includes(initial.window) ? initial.window : initial.window ? "otra" : (windows[0] ?? "otra");
  const [choice, setChoice] = useState(preset);

  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <Field label={pickup ? "Cuándo puede recoger" : "Franja de entrega"}>
        <select name="window" value={choice} onChange={(e) => setChoice(e.target.value)} className={inputClass}>
          {windows.map((w) => (
            <option key={w} value={w}>
              {w}
            </option>
          ))}
          <option value="otra">Otra…</option>
        </select>
      </Field>
      {choice === "otra" && (
        <Field label="Escribe la franja" hint='Ej. "Hoy entre 3 y 5 p. m."'>
          <input name="customWindow" maxLength={80} defaultValue={preset === "otra" ? (initial.window ?? "") : ""} className={inputClass} />
        </Field>
      )}
      <Field label="Nota para el cliente (opcional)" className="sm:col-span-2">
        <textarea name="note" rows={2} maxLength={500} defaultValue={initial.note ?? ""} className={inputClass} />
      </Field>
      {shipped && (
        <label className="flex items-center gap-2 text-sm font-semibold sm:col-span-2">
          <input type="checkbox" name="notify" className="size-4 accent-carbon" /> Enviar de nuevo el correo al cliente
        </label>
      )}
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="toon toon-press cursor-pointer rounded-full bg-estrella px-6 py-2.5 text-sm font-bold disabled:cursor-wait disabled:opacity-60"
        >
          {pending ? "Guardando…" : shipped ? "Guardar cambios" : pickup ? "Avisar que está listo" : "Despachar y avisar al cliente"}
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

/** Anular una contraentrega que no se entregó (anula también la remisión en Effi). */
export function CancelCod({ code }: { code: string }) {
  const [state, action, pending] = useActionState<LocalState, FormData>(cancelCodAction.bind(null, code), {});
  const [open, setOpen] = useState(false);
  if (!open)
    return (
      <button type="button" onClick={() => setOpen(true)} className="cursor-pointer justify-self-start text-sm font-semibold text-alerta underline-offset-4 hover:underline">
        Anular pedido (no se entregó)
      </button>
    );
  return (
    <form action={action} className="grid gap-3 rounded-2xl border-2 border-alerta/40 p-4">
      <p className="text-sm">
        Se anula el pedido y su remisión en Effi (el inventario vuelve). <strong>No se puede deshacer.</strong>
      </p>
      <Field label="Motivo">
        <input name="reason" maxLength={150} placeholder="El cliente no recibió el pedido" className={inputClass} />
      </Field>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className="cursor-pointer rounded-full bg-alerta px-5 py-2 text-sm font-bold text-crema disabled:opacity-60">
          {pending ? "Anulando…" : "Sí, anular"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="cursor-pointer text-sm font-semibold underline-offset-4 hover:underline">
          Cancelar
        </button>
        {state.error && (
          <p role="alert" className="w-full text-sm font-bold text-alerta">
            {state.error}
          </p>
        )}
      </div>
    </form>
  );
}
