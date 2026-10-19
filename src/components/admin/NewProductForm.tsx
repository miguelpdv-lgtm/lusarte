"use client";

import { useActionState, useState } from "react";
import { createProduct, type CreateState } from "@/app/admin/product-actions";
import { Field, inputClass } from "./Field";
import { emptyPresentation, PresentationFields, presentationPayload, type PresentationDraft } from "./PresentationFields";

type Props = { effiCategories: { id: number; nombre: string; tienda: string | null }[] };

/** Crea el producto en Effi (un artículo por presentación) y su ficha en la tienda. */
export function NewProductForm({ effiCategories }: Props) {
  const [state, action, pending] = useActionState<CreateState, FormData>(createProduct, {});
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [presentations, setPresentations] = useState<PresentationDraft[]>([emptyPresentation()]);

  const payload = {
    name,
    effiCategoryId: categoryId ? Number(categoryId) : undefined,
    description,
    presentations: presentations.map(presentationPayload),
  };
  const previewName = (label: string) => `${name} ${label}`.trim().toUpperCase();

  return (
    <form action={action} className="grid gap-6 pb-10">
      <input type="hidden" name="payload" value={JSON.stringify(payload)} />

      <section className="toon grid gap-4 rounded-[1.5rem] bg-crema-claro p-4 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre" hint="Sin la presentación: «Fragancia Chinola», no «Fragancia Chinola 30 ml».">
            <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} className={inputClass} />
          </Field>
          <Field label="Categoría en Effi">
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required className={inputClass}>
              <option value="" disabled>
                Elige una
              </option>
              {effiCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                  {c.tienda ? ` → ${c.tienda}` : " (no se muestra en la tienda)"}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Descripción" hint="Queda en la web y en Effi (descripción detallada). Las fotos se agregan después de crearlo.">
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} maxLength={2000} className={inputClass} />
        </Field>
      </section>

      <section className="toon grid gap-4 rounded-[1.5rem] bg-crema-claro p-4 sm:p-5">
        <div>
          <h2 className="font-display text-lg font-extrabold">Presentaciones</h2>
          <p className="text-sm text-carbon-suave">Cada presentación se crea como un artículo en Effi.</p>
        </div>
        <ol className="grid gap-3">
          {presentations.map((p, i) => (
            <li key={i} className="grid gap-2 rounded-2xl border-2 border-carbon/20 bg-white/60 p-3">
              <p className="text-xs font-semibold text-carbon-suave">
                En Effi: <span className="text-carbon">{name ? previewName(p.label) : "—"}</span>
              </p>
              <PresentationFields
                value={p}
                onChange={(patch) => setPresentations((list) => list.map((x, j) => (j === i ? { ...x, ...patch } : x)))}
                labelHint={presentations.length === 1 ? "Opcional si es una sola." : undefined}
              />
              {presentations.length > 1 && (
                <button type="button" onClick={() => setPresentations((list) => list.filter((_, j) => j !== i))} className="cursor-pointer justify-self-start text-sm font-bold underline">
                  Quitar
                </button>
              )}
            </li>
          ))}
        </ol>
        <button
          type="button"
          onClick={() => setPresentations((list) => [...list, emptyPresentation()])}
          className="toon toon-press cursor-pointer justify-self-start rounded-full bg-crema px-4 py-2 text-sm font-bold"
        >
          + Otra presentación
        </button>
      </section>

      {state.error && (
        <p role="alert" className="toon rounded-2xl bg-miel/60 px-4 py-3 text-sm font-semibold">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className="toon toon-press cursor-pointer justify-self-start rounded-full bg-estrella px-6 py-3 text-sm font-bold disabled:cursor-wait disabled:opacity-60">
        {pending ? "Creando en Effi…" : "Crear en Effi y en la tienda"}
      </button>
    </form>
  );
}
