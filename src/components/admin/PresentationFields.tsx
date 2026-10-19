"use client";

import { Field, inputClass } from "./Field";

/** Datos de una presentación nueva (se crea como artículo en Effi). Los números van como texto mientras se escriben. */
export type PresentationDraft = {
  label: string;
  referencia: string;
  price: string;
  precioEspecial: string;
  controlStock: boolean;
  stockInicial: string;
  costo: string;
  stockMinimo: string;
};

export const emptyPresentation = (label = ""): PresentationDraft => ({
  label,
  referencia: "",
  price: "",
  precioEspecial: "",
  controlStock: true,
  stockInicial: "",
  costo: "",
  stockMinimo: "",
});

const num = (v: string) => Number(v.replace(/[^\d]/g, "") || 0);

/** Convierte el borrador al formato que esperan las acciones del servidor. */
export const presentationPayload = (d: PresentationDraft) => ({
  label: d.label.trim(),
  referencia: d.referencia,
  price: num(d.price),
  precioEspecial: num(d.precioEspecial),
  controlStock: d.controlStock,
  stockInicial: d.controlStock ? num(d.stockInicial) : 0,
  costo: num(d.costo),
  stockMinimo: d.controlStock ? num(d.stockMinimo) : 0,
});

export function PresentationFields({
  value,
  onChange,
  labelHint,
}: {
  value: PresentationDraft;
  onChange: (patch: Partial<PresentationDraft>) => void;
  labelHint?: string;
}) {
  return (
    <div className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-4">
        <Field label="Presentación" hint={labelHint ?? "30 ml, 1 kg, Docena…"}>
          <input value={value.label} onChange={(e) => onChange({ label: e.target.value })} maxLength={60} className={inputClass} />
        </Field>
        <Field label="Referencia (opcional)">
          <input value={value.referencia} onChange={(e) => onChange({ referencia: e.target.value })} maxLength={40} className={inputClass} />
        </Field>
        <Field label="Precio">
          <input value={value.price} onChange={(e) => onChange({ price: e.target.value })} inputMode="numeric" required className={inputClass} />
        </Field>
        <Field label="Precio especial" hint="Opcional (mayoristas).">
          <input value={value.precioEspecial} onChange={(e) => onChange({ precioEspecial: e.target.value })} inputMode="numeric" className={inputClass} />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm font-bold">
        <input type="checkbox" checked={value.controlStock} onChange={(e) => onChange({ controlStock: e.target.checked })} className="size-4 accent-carbon" />
        Controlar stock en Effi
        <span className="font-normal text-carbon-suave">(apágalo para productos por encargo: se venden sin límite)</span>
      </label>
      {value.controlStock && (
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Stock inicial" hint="Se carga con un ajuste de inventario.">
            <input value={value.stockInicial} onChange={(e) => onChange({ stockInicial: e.target.value })} inputMode="numeric" className={inputClass} />
          </Field>
          <Field label="Costo unitario" hint="Obligatorio si hay stock inicial.">
            <input value={value.costo} onChange={(e) => onChange({ costo: e.target.value })} inputMode="numeric" className={inputClass} />
          </Field>
          <Field label="Stock mínimo">
            <input value={value.stockMinimo} onChange={(e) => onChange({ stockMinimo: e.target.value })} inputMode="numeric" className={inputClass} />
          </Field>
        </div>
      )}
    </div>
  );
}
