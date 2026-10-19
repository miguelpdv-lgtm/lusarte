"use client";

import { useActionState, useState } from "react";
import { addPresentation, adjustStock, annulOption, moveOption, type CreateState, type StockState } from "@/app/admin/product-actions";
import type { AdminOption, AdminProduct } from "@/lib/catalog/types";
import { inputClass } from "./Field";
import { emptyPresentation, PresentationFields, presentationPayload } from "./PresentationFields";

type Props = { product: AdminProduct; moveTargets: { id: number; name: string }[]; dirty: boolean };

/** Acciones que van directo a Effi (stock, anular, crear) y la corrección de la agrupación. */
export function PresentationTools({ product, moveTargets, dirty }: Props) {
  return (
    <section className="toon mt-6 mb-28 grid gap-4 rounded-[1.5rem] bg-crema-claro p-4 sm:p-5">
      <div>
        <h2 className="font-display text-lg font-extrabold">Stock y presentaciones</h2>
        <p className="mt-0.5 text-sm text-carbon-suave">
          Estos cambios se hacen al instante en Effi. {dirty && <strong>Guarda primero los cambios pendientes del formulario.</strong>}
        </p>
      </div>
      <ul className="grid gap-3">
        {product.options.map((o) => (
          <OptionTools key={o.id} option={o} moveTargets={moveTargets} disabled={dirty} />
        ))}
      </ul>
      <AddPresentation productId={product.id} disabled={dirty} />
    </section>
  );
}

function OptionTools({ option: o, moveTargets, disabled }: { option: AdminOption; moveTargets: { id: number; name: string }[]; disabled: boolean }) {
  const [state, action, pending] = useActionState<StockState, FormData>(adjustStock, {});
  return (
    <li className="grid gap-3 rounded-2xl border-2 border-carbon/15 bg-white/60 p-3">
      <p className="text-sm font-bold">
        {o.effiName} <span className="font-normal text-carbon-suave">· {o.name}</span>
      </p>

      {o.gestionStock > 1 ? (
        <form action={action} className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="optionId" value={o.id} />
          <label className="grid gap-1 text-xs font-bold">
            Stock en Effi
            <input name="stock" type="number" min={0} defaultValue={o.stock ?? 0} required className={`${inputClass} w-28 py-1.5`} />
          </label>
          <label className="grid gap-1 text-xs font-bold">
            Costo unitario (si sumas)
            <input name="costo" type="number" min={0} placeholder={o.costo ? String(o.costo) : "Obligatorio"} className={`${inputClass} w-36 py-1.5`} />
          </label>
          <button type="submit" disabled={pending || disabled} className="cursor-pointer rounded-full bg-carbon px-4 py-2 text-sm font-bold text-crema disabled:cursor-not-allowed disabled:opacity-40">
            {pending ? "Ajustando…" : "Ajustar stock"}
          </button>
          {state.ok && <span className="text-sm font-semibold text-oliva">✓ {state.ok}</span>}
          {state.error && <span className="text-sm font-semibold">{state.error}</span>}
        </form>
      ) : (
        <p className="text-sm text-carbon-suave">Sin control de stock en Effi: se vende sin límite.</p>
      )}

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <form action={moveOption} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="optionId" value={o.id} />
          <select name="target" defaultValue="" aria-label={`Mover ${o.effiName}`} className="max-w-full rounded-full border-2 border-carbon/60 bg-white px-3 py-1.5 text-sm">
            <option value="">Separar en un producto propio</option>
            {moveTargets.map((t) => (
              <option key={t.id} value={t.id}>
                Mover a: {t.name}
              </option>
            ))}
          </select>
          <button type="submit" disabled={disabled} className="cursor-pointer rounded-full border-2 border-carbon px-3 py-1.5 font-bold disabled:cursor-not-allowed disabled:opacity-40">
            Aplicar
          </button>
        </form>

        <details className="ml-auto">
          <summary className="cursor-pointer rounded-full px-3 py-1.5 font-bold text-carbon-suave hover:bg-miel/50">Anular en Effi…</summary>
          <form action={annulOption} className="mt-2 grid max-w-xs gap-2 rounded-xl bg-miel/40 p-3">
            <input type="hidden" name="optionId" value={o.id} />
            <p>Se anula el artículo en Effi y sale de la tienda. Se puede reactivar desde Effi.</p>
            <button type="submit" disabled={disabled} className="cursor-pointer justify-self-start rounded-full bg-carbon px-4 py-1.5 font-bold text-crema disabled:opacity-40">
              Sí, anular
            </button>
          </form>
        </details>
      </div>
    </li>
  );
}

function AddPresentation({ productId, disabled }: { productId: number; disabled: boolean }) {
  const [state, action, pending] = useActionState<CreateState, FormData>(addPresentation, {});
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(emptyPresentation());
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="toon toon-press justify-self-start cursor-pointer rounded-full bg-estrella px-4 py-2 text-sm font-bold">
        + Agregar presentación
      </button>
    );
  }
  return (
    <form action={action} className="grid gap-3 rounded-2xl border-2 border-carbon bg-white/70 p-4">
      <h3 className="font-bold">Nueva presentación (se crea en Effi)</h3>
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="payload" value={JSON.stringify(presentationPayload(draft))} />
      <PresentationFields value={draft} onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))} />
      {state.error && (
        <p role="alert" className="rounded-xl bg-miel/60 px-3 py-2 text-sm font-semibold">
          {state.error}
        </p>
      )}
      <div className="flex gap-2">
        <button type="submit" disabled={pending || disabled} className="cursor-pointer rounded-full bg-carbon px-4 py-2 text-sm font-bold text-crema disabled:opacity-40">
          {pending ? "Creando en Effi…" : "Crear presentación"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="cursor-pointer rounded-full px-4 py-2 text-sm font-bold">
          Cancelar
        </button>
      </div>
    </form>
  );
}
