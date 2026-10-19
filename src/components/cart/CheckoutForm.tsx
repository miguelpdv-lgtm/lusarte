"use client";

import Link from "next/link";
import { useActionState, useEffect, useState, type ReactNode } from "react";
import { citiesFor, placeOrder, type CheckoutState } from "@/app/(sitio)/checkout-actions";
import { cartSubtotal, useCart } from "@/lib/cart/store";
import { lineKey } from "@/lib/cart/types";
import { formatCOP } from "@/lib/format";
import { lineStatus, useQuote } from "./useQuote";

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

type Props = { shipping: number; departments: { id: number; name: string }[]; idTypes: Record<string, string> };

export function CheckoutForm({ shipping, departments, idTypes }: Props) {
  const lines = useCart();
  const quote = useQuote(lines);
  const [state, action, pending] = useActionState<CheckoutState, FormData>(placeOrder, {});
  const blocked = lines.some((l) => lineStatus(quote, l).blocked);
  const subtotal = cartSubtotal(lines);
  const v = state.values ?? {};
  const f = state.fields ?? {};
  const [departmentId, setDepartmentId] = useState(v.departmentId ?? "");
  const [cities, setCities] = useState<string[]>([]);

  // Municipios del departamento elegido, para autocompletar
  useEffect(() => {
    if (!departmentId) return;
    let alive = true;
    citiesFor(Number(departmentId)).then((list) => alive && setCities(list));
    return () => {
      alive = false;
    };
  }, [departmentId]);

  // Pedido creado: al pago en Wompi
  useEffect(() => {
    if (state.payUrl) window.location.assign(state.payUrl);
  }, [state.payUrl]);

  if (lines.length === 0 && !state.payUrl) {
    return (
      <div className="toon rounded-[1.75rem] bg-crema-claro px-6 py-12 text-center">
        <p className="font-hand text-3xl">Tu carrito está vacío</p>
        <Link href="/tienda" className="toon toon-press mt-6 inline-block rounded-full bg-estrella px-6 py-3 text-sm font-bold">
          Ver la tienda
        </Link>
      </div>
    );
  }

  const cartJson = JSON.stringify(lines.map((l) => ({ optionId: l.optionId, quantity: l.quantity, note: l.note })));

  return (
    <form action={action} className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start" noValidate>
      <input type="hidden" name="cart" value={cartJson} />

      <div className="grid gap-8">
        <fieldset className="toon grid gap-4 rounded-[1.75rem] bg-crema-claro p-5 sm:grid-cols-2 sm:p-6">
          <legend className="sr-only">Tus datos</legend>
          <h2 className="font-display text-xl font-extrabold sm:col-span-2">Tus datos</h2>
          <Field label="Nombre completo" error={f.name} className="sm:col-span-2">
            <input name="name" autoComplete="name" required defaultValue={v.name} aria-invalid={!!f.name} className={inputClass} />
          </Field>
          <Field label="Correo" error={f.email} hint="Te enviamos la confirmación y la guía.">
            <input name="email" type="email" autoComplete="email" required defaultValue={v.email} aria-invalid={!!f.email} className={inputClass} />
          </Field>
          <Field label="Celular" error={f.phone}>
            <input name="phone" type="tel" inputMode="tel" autoComplete="tel-national" required defaultValue={v.phone} aria-invalid={!!f.phone} className={inputClass} />
          </Field>
          <Field label="Tipo de documento" error={f.legalIdType}>
            <select name="legalIdType" required defaultValue={v.legalIdType ?? "2"} aria-invalid={!!f.legalIdType} className={inputClass}>
              {Object.entries(idTypes).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Número de documento" error={f.legalId} hint="Lo necesitamos para registrar tu compra.">
            <input name="legalId" inputMode="numeric" autoComplete="off" required defaultValue={v.legalId} aria-invalid={!!f.legalId} className={inputClass} />
          </Field>
        </fieldset>

        <fieldset className="toon grid gap-4 rounded-[1.75rem] bg-crema-claro p-5 sm:grid-cols-2 sm:p-6">
          <legend className="sr-only">Dirección de envío</legend>
          <h2 className="font-display text-xl font-extrabold sm:col-span-2">¿A dónde lo enviamos?</h2>
          <Field label="Departamento" error={f.departmentId}>
            <select
              name="departmentId"
              required
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
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
              list="municipios"
              autoComplete="off"
              required
              disabled={!departmentId}
              defaultValue={v.city}
              aria-invalid={!!f.city}
              className={`${inputClass} disabled:opacity-50`}
            />
            <datalist id="municipios">
              {cities.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>
          <Field label="Dirección" error={f.address} className="sm:col-span-2">
            <input name="address" autoComplete="street-address" required defaultValue={v.address} aria-invalid={!!f.address} placeholder="Calle 10 # 20-30" className={inputClass} />
          </Field>
          <Field label="Indicaciones (opcional)" error={f.addressNotes} className="sm:col-span-2">
            <input name="addressNotes" defaultValue={v.addressNotes} placeholder="Apartamento, barrio, punto de referencia" className={inputClass} />
          </Field>
        </fieldset>
      </div>

      <aside className="toon toon-shadow grid gap-4 rounded-[1.75rem] bg-crema-claro p-5 lg:sticky lg:top-32">
        <h2 className="font-display text-xl font-extrabold">Tu pedido</h2>
        <ul className="grid max-h-72 gap-3 overflow-y-auto text-sm">
          {lines.map((l) => {
            const s = lineStatus(quote, l);
            return (
              <li key={lineKey(l)} className="flex justify-between gap-3">
                <span className="min-w-0">
                  <span className="font-semibold">{l.productName}</span>
                  {l.optionName && <span className="text-carbon-suave"> · {l.optionName}</span>}
                  <span className="text-carbon-suave"> × {l.quantity}</span>
                  {s.blocked && <span className="block text-xs font-bold text-alerta">{s.unavailable ? "Ya no está disponible" : `Solo quedan ${s.max}`}</span>}
                </span>
                <span className="shrink-0 font-bold tabular-nums">{formatCOP(l.price * l.quantity)}</span>
              </li>
            );
          })}
        </ul>
        <dl className="grid gap-2 border-t-2 border-carbon/10 pt-3 text-sm">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd className="font-bold tabular-nums">{formatCOP(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Envío</dt>
            <dd className="font-bold tabular-nums">{formatCOP(shipping)}</dd>
          </div>
          <div className="flex justify-between border-t-2 border-carbon/10 pt-3 text-base">
            <dt className="font-bold">Total</dt>
            <dd className="font-display text-xl font-extrabold tabular-nums">{formatCOP(subtotal + shipping)}</dd>
          </div>
        </dl>

        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="terms" required defaultChecked={v.terms === "on"} className="mt-1 size-4 shrink-0 accent-carbon" />
          <span>
            Acepto los{" "}
            <Link href="/terminos" target="_blank" className="font-bold underline underline-offset-2">
              términos
            </Link>{" "}
            y la{" "}
            <Link href="/privacidad" target="_blank" className="font-bold underline underline-offset-2">
              política de tratamiento de datos
            </Link>
            .
          </span>
        </label>
        {f.terms && <p className="-mt-2 text-xs font-bold text-alerta">{f.terms}</p>}

        {state.error && (
          <p role="alert" className="rounded-xl bg-miel/60 px-3 py-2 text-sm font-semibold">
            {state.error}{" "}
            {blocked && (
              <Link href="/carrito" className="underline">
                Ir al carrito
              </Link>
            )}
          </p>
        )}

        <button
          type="submit"
          disabled={pending || blocked || !!state.payUrl}
          className="toon toon-press cursor-pointer rounded-full bg-estrella px-6 py-3 text-sm font-bold disabled:cursor-wait disabled:opacity-60"
        >
          {state.payUrl ? "Abriendo Wompi…" : pending ? "Creando tu pedido…" : `Pagar ${formatCOP(subtotal + shipping)}`}
        </button>
        <p className="text-center text-xs text-carbon-suave">Pago seguro con Wompi: tarjeta, PSE, Nequi o Bancolombia.</p>
      </aside>
    </form>
  );
}
