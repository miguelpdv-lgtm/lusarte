"use client";

import { useActionState, useEffect, useState, type ReactNode } from "react";
import { createManualOrderAction, type ManualOrderState } from "@/app/admin/manual-order-actions";
import { barriosFor, citiesFor, shippingFor } from "@/app/(sitio)/checkout-actions";
import { formatCOP } from "@/lib/format";
import type { Delivery, DeliveryOption } from "@/lib/shop/shipping";

const inputClass =
  "w-full rounded-xl border-2 border-carbon/80 bg-white px-3 py-2.5 text-[0.95rem] outline-none transition-shadow focus:shadow-[3px_3px_0_var(--color-carbon)] aria-invalid:border-alerta";

function Field({ label, error, hint, className = "", children }: { label: string; error?: string; hint?: string; className?: string; children: ReactNode }) {
  return (
    <label className={`grid content-start gap-1.5 ${className}`}>
      <span className="text-sm font-bold">{label}</span>
      {children}
      {error ? <span className="text-xs font-bold text-alerta">{error}</span> : hint && <span className="text-xs text-carbon-suave">{hint}</span>}
    </label>
  );
}

type ProductChoice = { optionId: number; name: string; price: number; units: number | null };
type Line = { optionId: number; quantity: number };
type Props = { products: ProductChoice[]; departments: { id: number; name: string }[]; idTypes: Record<string, string> };

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

export function ManualOrderForm({ products, departments, idTypes }: Props) {
  const [state, action, pending] = useActionState<ManualOrderState, FormData>(createManualOrderAction, {});
  const v = state.values ?? {};
  const f = state.fields ?? {};
  const byId = new Map(products.map((p) => [p.optionId, p]));

  // Productos
  const [lines, setLines] = useState<Line[]>([]);
  const [search, setSearch] = useState("");
  const [qty, setQty] = useState(1);
  // Resultados: todas las palabras escritas en el nombre; primero los que empiezan por lo escrito
  const words = norm(search).split(/\s+/).filter(Boolean);
  const results =
    search.trim().length < 2
      ? []
      : products
          .filter((p) => words.every((w) => norm(p.name).includes(w)))
          .sort((a, b) => Number(norm(b.name).startsWith(words[0])) - Number(norm(a.name).startsWith(words[0])))
          .slice(0, 8);
  function addLine(p: ProductChoice) {
    setLines((ls) => {
      const found = ls.find((l) => l.optionId === p.optionId);
      return found ? ls.map((l) => (l === found ? { ...l, quantity: l.quantity + qty } : l)) : [...ls, { optionId: p.optionId, quantity: qty }];
    });
    setSearch("");
    setQty(1);
  }
  const subtotal = lines.reduce((s, l) => s + (byId.get(l.optionId)?.price ?? 0) * l.quantity, 0);

  // Dirección y entrega (las mismas reglas del checkout)
  const [departmentId, setDepartmentId] = useState(v.departmentId ?? "");
  const [cities, setCities] = useState<string[]>([]);
  const [city, setCity] = useState(v.city ?? "");
  const [barrios, setBarrios] = useState<{ id: number; name: string }[]>([]);
  const [barrio, setBarrio] = useState(v.barrio ?? "");
  const [options, setOptions] = useState<DeliveryOption[] | null>(null);
  const [delivery, setDelivery] = useState<Delivery>((v.delivery as Delivery) || "domicilio");
  const [paymentType, setPaymentType] = useState<"transferencia" | "contraentrega">(v.paymentType === "contraentrega" ? "contraentrega" : "transferencia");
  const matched = (() => {
    const q = norm(barrio);
    if (q.length < 3) return null;
    const exact = barrios.find((b) => norm(b.name) === q);
    if (exact) return exact;
    const partial = barrios.filter((b) => norm(b.name).includes(q));
    return partial.length === 1 ? partial[0] : null;
  })();
  const barrioId = matched?.id ?? null;
  const quote = options ? (options.find((o) => o.delivery === delivery) ?? options[0]) : null;
  const payment = quote?.cod ? paymentType : "transferencia";
  const shipping = quote?.price ?? 0;

  useEffect(() => {
    if (!departmentId) return;
    let alive = true;
    citiesFor(Number(departmentId)).then((list) => alive && setCities(list));
    return () => {
      alive = false;
    };
  }, [departmentId]);

  useEffect(() => {
    if (!departmentId || !city.trim()) return;
    let alive = true;
    const t = setTimeout(() => barriosFor(Number(departmentId), city).then((list) => alive && setBarrios(list)), 250);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [departmentId, city]);

  useEffect(() => {
    if (!departmentId || !city.trim()) return;
    let alive = true;
    const t = setTimeout(() => shippingFor(Number(departmentId), city, barrioId).then((q) => alive && setOptions(q)), 250);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [departmentId, city, barrioId]);

  const ready = lines.length > 0 && !!quote && quote.available;

  return (
    <form action={action} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start" noValidate>
      <input type="hidden" name="lines" value={JSON.stringify(lines.map((l) => ({ ...l, note: "" })))} />

      <div className="grid gap-6">
        <fieldset className="toon grid gap-3 rounded-[1.5rem] bg-crema-claro p-5">
          <legend className="sr-only">Productos</legend>
          <h2 className="font-display text-xl font-extrabold">Productos</h2>
          <div className="grid grid-cols-[1fr_5.5rem] items-end gap-2">
            <Field label="Buscar producto" hint="Escribe parte del nombre y toca el producto para agregarlo.">
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (results.length === 1) addLine(results[0]);
                  }
                }}
                placeholder="Ej. cera de soja"
                autoComplete="off"
                className={inputClass}
              />
            </Field>
            <Field label="Cantidad">
              <input type="number" min={1} value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))} className={inputClass} />
            </Field>
          </div>
          {search.trim().length >= 2 && (
            <ul aria-label="Resultados" className="grid gap-1.5">
              {results.length === 0 && <li className="text-sm text-carbon-suave">No hay productos disponibles con ese nombre.</li>}
              {results.map((p) => (
                <li key={p.optionId}>
                  <button
                    type="button"
                    onClick={() => addLine(p)}
                    className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl border-2 border-carbon/20 bg-white px-3 py-2 text-left text-sm hover:border-carbon"
                  >
                    <span className="min-w-0">
                      <span className="font-semibold">{p.name}</span>
                      {p.units !== null && <span className="block text-xs text-carbon-suave">{p.units} disponibles</span>}
                    </span>
                    <span className="shrink-0 font-bold tabular-nums">+ {formatCOP(p.price)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {lines.length === 0 ? (
            <p className="text-sm text-carbon-suave">Todavía no hay productos.</p>
          ) : (
            <ul className="divide-y divide-carbon/10 text-sm">
              {lines.map((l) => {
                const p = byId.get(l.optionId)!;
                const over = p.units !== null && l.quantity > p.units;
                return (
                  <li key={l.optionId} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
                    <span className="min-w-0 basis-full sm:basis-0 sm:flex-1">
                      <span className="font-semibold">{p.name}</span>
                      <span className="block text-xs text-carbon-suave">
                        {formatCOP(p.price)} c/u{p.units !== null && ` · ${p.units} disponibles`}
                      </span>
                      {over && <span className="block text-xs font-bold text-alerta">Solo hay {p.units} en el inventario.</span>}
                    </span>
                    <input
                      type="number"
                      min={1}
                      aria-label={`Cantidad de ${p.name}`}
                      value={l.quantity}
                      onChange={(e) => {
                        const q = Math.max(1, Number(e.target.value) || 1);
                        setLines((ls) => ls.map((x) => (x.optionId === l.optionId ? { ...x, quantity: q } : x)));
                      }}
                      className="w-16 rounded-lg border-2 border-carbon/60 bg-white px-2 py-1"
                    />
                    <span className="ml-auto w-24 text-right font-bold tabular-nums sm:ml-0">{formatCOP(p.price * l.quantity)}</span>
                    <button
                      type="button"
                      onClick={() => setLines((ls) => ls.filter((x) => x.optionId !== l.optionId))}
                      className="cursor-pointer text-xs font-bold underline"
                    >
                      Quitar
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </fieldset>

        <fieldset className="toon grid gap-4 rounded-[1.5rem] bg-crema-claro p-5 sm:grid-cols-2">
          <legend className="sr-only">Cliente</legend>
          <h2 className="font-display text-xl font-extrabold sm:col-span-2">Cliente</h2>
          <Field label="Nombre completo" error={f.name} className="sm:col-span-2">
            <input name="name" required defaultValue={v.name} aria-invalid={!!f.name} className={inputClass} />
          </Field>
          <Field label="Correo" error={f.email} hint="Ahí le llega la confirmación con el comprobante.">
            <input name="email" type="email" required defaultValue={v.email} aria-invalid={!!f.email} className={inputClass} />
          </Field>
          <Field label="Celular" error={f.phone}>
            <input name="phone" type="tel" inputMode="tel" required defaultValue={v.phone} aria-invalid={!!f.phone} className={inputClass} />
          </Field>
          <Field label="Tipo de documento" error={f.legalIdType}>
            <select name="legalIdType" defaultValue={v.legalIdType ?? "2"} aria-invalid={!!f.legalIdType} className={inputClass}>
              {Object.entries(idTypes).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Número de documento" error={f.legalId} hint="Se usa para la remisión en Effi.">
            <input name="legalId" inputMode="numeric" required defaultValue={v.legalId} aria-invalid={!!f.legalId} className={inputClass} />
          </Field>
        </fieldset>

        <fieldset className="toon grid gap-4 rounded-[1.5rem] bg-crema-claro p-5 sm:grid-cols-2">
          <legend className="sr-only">Entrega</legend>
          <h2 className="font-display text-xl font-extrabold sm:col-span-2">Entrega</h2>
          <Field label="Departamento" error={f.departmentId}>
            <select
              name="departmentId"
              value={departmentId}
              onChange={(e) => {
                setDepartmentId(e.target.value);
                setOptions(null);
                setBarrios([]);
              }}
              aria-invalid={!!f.departmentId}
              className={inputClass}
            >
              <option value="" disabled>
                Elige…
              </option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Ciudad o municipio" error={f.city} hint={departmentId ? "Escribe y elige de la lista." : "Primero elige el departamento."}>
            <input
              name="city"
              list="municipios-panel"
              autoComplete="off"
              disabled={!departmentId}
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                setOptions(null);
                setBarrios([]);
              }}
              aria-invalid={!!f.city}
              className={`${inputClass} disabled:opacity-50`}
            />
            <datalist id="municipios-panel">
              {cities.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>
          {barrios.length > 0 && (
            <Field label="Barrio" hint={barrio && !barrioId ? "Elige un barrio de la lista (o el más cercano)." : "Define la zona y el valor del domicilio."} className="sm:col-span-2">
              <input name="barrio" list="barrios-panel" autoComplete="off" value={barrio} onChange={(e) => setBarrio(e.target.value)} className={inputClass} />
              <datalist id="barrios-panel">
                {barrios.map((b) => (
                  <option key={b.id} value={b.name} />
                ))}
              </datalist>
            </Field>
          )}
          <input type="hidden" name="barrioId" value={barrioId ?? ""} />
          <Field label="Dirección" error={f.address} className="sm:col-span-2">
            <input name="address" required defaultValue={v.address} aria-invalid={!!f.address} className={inputClass} />
          </Field>
          <Field label="Indicaciones (opcional)" error={f.addressNotes} className="sm:col-span-2">
            <input name="addressNotes" defaultValue={v.addressNotes} className={inputClass} />
          </Field>

          {options && quote && (
            <div className="grid gap-2 sm:col-span-2">
              <input type="hidden" name="delivery" value={quote.delivery} />
              {options.map((o) => (
                <label
                  key={o.delivery}
                  className={`flex cursor-pointer items-start gap-3 rounded-2xl border-2 px-4 py-3 ${quote.delivery === o.delivery ? "border-carbon bg-white" : "border-carbon/20"}`}
                >
                  <input type="radio" checked={quote.delivery === o.delivery} onChange={() => setDelivery(o.delivery)} className="mt-1 accent-carbon" />
                  <span className="flex-1">
                    <span className="flex justify-between gap-3 font-bold">
                      {o.title}
                      <span className="shrink-0 tabular-nums">
                        {o.delivery === "nacional" ? "Al cobro" : !o.available ? "—" : o.price ? formatCOP(o.price) : "Gratis"}
                      </span>
                    </span>
                    <span className="block text-sm text-carbon-suave">{o.estimate}</span>
                  </span>
                </label>
              ))}
            </div>
          )}
        </fieldset>
      </div>

      <aside className="toon toon-shadow grid gap-4 rounded-[1.5rem] bg-crema-claro p-5 lg:sticky lg:top-32">
        <h2 className="font-display text-xl font-extrabold">Pago</h2>
        <div role="radiogroup" aria-label="Forma de pago" className="grid gap-2">
          {(
            [
              ["transferencia", "Ya pagó por transferencia", "Queda pagado. La remisión en Effi va de contado."],
              ...(quote?.cod ? [["contraentrega", "Paga al recibir", "Queda confirmado, por cobrar al entregar."]] : []),
            ] as [string, string, string][]
          ).map(([value, title, hint]) => (
            <label
              key={value}
              className={`flex cursor-pointer items-start gap-3 rounded-2xl border-2 px-4 py-3 ${payment === value ? "border-carbon bg-white" : "border-carbon/20"}`}
            >
              <input
                type="radio"
                name="paymentType"
                value={value}
                checked={payment === value}
                onChange={() => setPaymentType(value as "transferencia" | "contraentrega")}
                className="mt-1 accent-carbon"
              />
              <span>
                <span className="block font-bold">{title}</span>
                <span className="text-sm text-carbon-suave">{hint}</span>
              </span>
            </label>
          ))}
        </div>

        <dl className="grid gap-2 border-t-2 border-carbon/10 pt-3 text-sm">
          <div className="flex justify-between">
            <dt>Productos</dt>
            <dd className="font-bold tabular-nums">{formatCOP(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Envío</dt>
            <dd className="font-bold tabular-nums">{!quote ? "Según la ciudad" : quote.delivery === "nacional" ? "Al cobro" : shipping ? formatCOP(shipping) : "Gratis"}</dd>
          </div>
          <div className="flex justify-between border-t-2 border-carbon/10 pt-3 text-base">
            <dt className="font-bold">Total</dt>
            <dd className="font-display text-xl font-extrabold tabular-nums">{formatCOP(subtotal + shipping)}</dd>
          </div>
        </dl>

        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="notify" defaultChecked={state.values ? v.notify === "on" : true} className="mt-1 size-4 shrink-0 accent-carbon" />
          <span>Enviarle al cliente el correo de confirmación con el comprobante</span>
        </label>

        {state.error && (
          <p role="alert" className="rounded-xl bg-miel/60 px-3 py-2 text-sm font-semibold">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending || !ready}
          className="toon toon-press cursor-pointer rounded-full bg-estrella px-6 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending
            ? "Registrando…"
            : lines.length === 0
              ? "Agrega productos"
              : !quote
                ? "Elige la ciudad"
                : !quote.available
                  ? quote.needsBarrio && !barrioId
                    ? "Elige el barrio"
                    : "Elige otra entrega"
                  : "Registrar pedido"}
        </button>
        <p className="text-center text-xs text-carbon-suave">Al registrarlo se descuenta el inventario y se crea la remisión en Effi.</p>
      </aside>
    </form>
  );
}
