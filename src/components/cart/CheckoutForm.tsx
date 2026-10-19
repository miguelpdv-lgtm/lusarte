"use client";

import Link from "next/link";
import { useActionState, useEffect, useState, type ReactNode } from "react";
import { barriosFor, citiesFor, nearestBarrioTo, placeOrder, shippingFor, type CheckoutState } from "@/app/(sitio)/checkout-actions";
import type { Delivery, DeliveryOption } from "@/lib/shop/shipping";
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

type Props = { departments: { id: number; name: string }[]; idTypes: Record<string, string> };

export function CheckoutForm({ departments, idTypes }: Props) {
  const lines = useCart();
  const stock = useQuote(lines);
  const [state, action, pending] = useActionState<CheckoutState, FormData>(placeOrder, {});
  const blocked = lines.some((l) => lineStatus(stock, l).blocked);
  const subtotal = cartSubtotal(lines);
  const v = state.values ?? {};
  const f = state.fields ?? {};
  const [departmentId, setDepartmentId] = useState(v.departmentId ?? "");
  const [cities, setCities] = useState<string[]>([]);
  const [city, setCity] = useState(v.city ?? "");
  const [options, setOptions] = useState<DeliveryOption[] | null>(null);
  const [barrios, setBarrios] = useState<{ id: number; name: string }[]>([]);
  const [barrio, setBarrio] = useState(v.barrio ?? "");
  const [locating, setLocating] = useState<"" | "buscando" | "error">("");
  const [nearby, setNearby] = useState<{ id: number; name: string; meters: number }[]>([]);
  const norm = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  // Nombre exacto; si no, el único barrio que contiene lo escrito ("juan mina" → "Corregimiento Juan Mina")
  const matched = (() => {
    const q = norm(barrio);
    if (q.length < 3) return null;
    const exact = barrios.find((b) => norm(b.name) === q);
    if (exact) return exact;
    const partial = barrios.filter((b) => norm(b.name).includes(q));
    return partial.length === 1 ? partial[0] : null;
  })();
  const barrioId = matched?.id ?? null;
  const [delivery, setDelivery] = useState<Delivery>((v.delivery as Delivery) || "domicilio");
  const [paymentType, setPaymentType] = useState<"wompi" | "contraentrega">(v.paymentType === "contraentrega" ? "contraentrega" : "wompi");
  const quote = options ? (options.find((o) => o.delivery === delivery) ?? options[0]) : null;
  const shipping = quote ? quote.price : null;
  const total = subtotal + (shipping ?? 0);
  const cod = !!quote?.cod && paymentType === "contraentrega";

  // Tarifa y estimado de entrega al elegir el municipio
  useEffect(() => {
    if (!departmentId || !city.trim()) return;
    let alive = true;
    const t = setTimeout(() => shippingFor(Number(departmentId), city, barrioId).then((q) => alive && setOptions(q)), 250);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [departmentId, city, barrioId]);

  // Barrios del municipio (Barranquilla y Soledad)
  useEffect(() => {
    if (!departmentId || !city.trim()) return;
    let alive = true;
    const t = setTimeout(() => barriosFor(Number(departmentId), city).then((list) => alive && setBarrios(list)), 250);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [departmentId, city]);

  function locateMe() {
    if (!navigator.geolocation) return setLocating("error");
    setLocating("buscando");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const list = await nearestBarrioTo(Number(departmentId), city, pos.coords.latitude, pos.coords.longitude);
        setNearby(list);
        if (list[0]) setBarrio(list[0].name);
        setLocating(list.length ? "" : "error");
      },
      () => setLocating("error"),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }

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
    else if (state.orderUrl) window.location.assign(state.orderUrl);
  }, [state.payUrl, state.orderUrl]);

  if (lines.length === 0 && !state.payUrl && !state.orderUrl) {
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
              onChange={(e) => {
                setDepartmentId(e.target.value);
                setOptions(null);
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
              list="municipios"
              autoComplete="off"
              required
              disabled={!departmentId}
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                setOptions(null);
              }}
              aria-invalid={!!f.city}
              className={`${inputClass} disabled:opacity-50`}
            />
            <datalist id="municipios">
              {cities.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>
          {barrios.length > 0 && (
            <div className="grid gap-1.5 sm:col-span-2">
              <Field
                label="Barrio"
                error={f.barrioId}
                hint="Escribe y elige de la lista. ¿No encuentras el tuyo? Elige el barrio más cercano."
              >
                <input
                  name="barrio"
                  list="barrios"
                  autoComplete="off"
                  value={barrio}
                  onChange={(e) => {
                    setBarrio(e.target.value);
                    setNearby([]);
                  }}
                  aria-invalid={!!f.barrioId || (!!barrio && !barrioId)}
                  placeholder="Ej. El Prado"
                  className={inputClass}
                />
                <datalist id="barrios">
                  {barrios.map((b) => (
                    <option key={b.id} value={b.name} />
                  ))}
                </datalist>
              </Field>
              <input type="hidden" name="barrioId" value={barrioId ?? ""} />
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <button type="button" onClick={locateMe} className="cursor-pointer font-bold underline underline-offset-4">
                  {locating === "buscando" ? "Buscando tu ubicación…" : "📍 Usar mi ubicación"}
                </button>
                {locating === "error" && <span className="text-alerta">No pudimos ubicarte: elige tu barrio en la lista.</span>}
                {barrio && !barrioId && <span className="text-alerta">Elige un barrio de la lista (o el más cercano).</span>}
                {matched && norm(matched.name) !== norm(barrio) && <span className="text-carbon-suave">Barrio: {matched.name}</span>}
                {nearby.length > 1 && (
                  <span className="text-carbon-suave">
                    ¿O es{" "}
                    {nearby.slice(1).map((b, i) => (
                      <span key={b.id}>
                        {i > 0 && " o "}
                        <button type="button" onClick={() => setBarrio(b.name)} className="cursor-pointer font-semibold underline">
                          {b.name}
                        </button>
                      </span>
                    ))}
                    ?
                  </span>
                )}
              </div>
              <p className="text-[0.7rem] text-carbon-suave">Barrios: Alcaldía de Barranquilla y © colaboradores de OpenStreetMap.</p>
            </div>
          )}
          <Field label="Dirección" error={f.address} className="sm:col-span-2">
            <input name="address" autoComplete="street-address" required defaultValue={v.address} aria-invalid={!!f.address} placeholder="Calle 10 # 20-30" className={inputClass} />
          </Field>
          <Field label="Indicaciones (opcional)" error={f.addressNotes} className="sm:col-span-2">
            <input name="addressNotes" defaultValue={v.addressNotes} placeholder="Apartamento, barrio, punto de referencia" className={inputClass} />
          </Field>
        </fieldset>
        <fieldset className="toon grid gap-3 rounded-[1.75rem] bg-crema-claro p-5 sm:p-6">
          <legend className="sr-only">Envío y pago</legend>
          <h2 className="font-display text-xl font-extrabold">Envío y pago</h2>
          {!quote || !options ? (
            <p className="text-sm text-carbon-suave">Elige tu departamento y municipio para ver cómo te llega.</p>
          ) : (
            <>
              <input type="hidden" name="delivery" value={quote.delivery} />
              <div role="radiogroup" aria-label="Entrega" className="grid gap-2">
                {options.map((o) => (
                  <label
                    key={o.delivery}
                    className={`flex cursor-pointer items-start gap-3 rounded-2xl border-2 px-4 py-3 ${quote.delivery === o.delivery ? "border-carbon bg-white" : "border-carbon/20"}`}
                  >
                    <input
                      type="radio"
                      checked={quote.delivery === o.delivery}
                      onChange={() => setDelivery(o.delivery)}
                      className="mt-1 accent-carbon"
                    />
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
              <div role="radiogroup" aria-label="Forma de pago" className="grid gap-2">
                <p className="text-sm font-bold">¿Cómo quieres pagar?</p>
                {(
                  [
                    ["wompi", "Pagar en línea", "Tarjeta, PSE, Nequi o Bancolombia con Wompi."],
                    ...(quote.cod
                      ? [["contraentrega", "Pagar al recibir", "En efectivo o transferencia. Te escribimos por WhatsApp para confirmar el pedido y coordinar la entrega."]]
                      : []),
                  ] as [string, string, string][]
                ).map(([value, title, hint]) => (
                  <label
                    key={value}
                    className={`flex cursor-pointer items-start gap-3 rounded-2xl border-2 px-4 py-3 ${
                      (quote.cod ? paymentType : "wompi") === value ? "border-carbon bg-white" : "border-carbon/20"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentType"
                      value={value}
                      checked={(quote.cod ? paymentType : "wompi") === value}
                      onChange={() => setPaymentType(value as "wompi" | "contraentrega")}
                      className="mt-1 accent-carbon"
                    />
                    <span>
                      <span className="block font-bold">{title}</span>
                      <span className="text-sm text-carbon-suave">{hint}</span>
                    </span>
                  </label>
                ))}
              </div>
            </>
          )}
        </fieldset>
      </div>


      <aside className="toon toon-shadow grid gap-4 rounded-[1.75rem] bg-crema-claro p-5 lg:sticky lg:top-32">
        <h2 className="font-display text-xl font-extrabold">Tu pedido</h2>
        <ul className="grid max-h-72 gap-3 overflow-y-auto text-sm">
          {lines.map((l) => {
            const s = lineStatus(stock, l);
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
            <dd className="font-bold tabular-nums">
              {!quote ? "Según tu ciudad" : quote.delivery === "nacional" ? "Al cobro" : shipping ? formatCOP(shipping) : "Gratis"}
            </dd>
          </div>
          <div className="flex justify-between border-t-2 border-carbon/10 pt-3 text-base">
            <dt className="font-bold">Total</dt>
            <dd className="font-display text-xl font-extrabold tabular-nums">{formatCOP(total)}</dd>
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
          disabled={pending || blocked || !quote || !quote.available || !!state.payUrl || !!state.orderUrl}
          className="toon toon-press cursor-pointer rounded-full bg-estrella px-6 py-3 text-sm font-bold disabled:cursor-wait disabled:opacity-60"
        >
          {state.payUrl
            ? "Abriendo Wompi…"
            : state.orderUrl
              ? "Confirmando…"
              : pending
                ? "Creando tu pedido…"
                : !quote
                  ? "Elige tu ciudad para continuar"
                  : !quote.available
                    ? quote.needsBarrio && !barrioId
                      ? "Elige tu barrio para continuar"
                      : "Elige recoger o escríbenos por WhatsApp"
                  : cod
                    ? "Enviar pedido · pagas al recibir"
                    : `Pagar ${formatCOP(total)}`}
        </button>
        <p className="text-center text-xs text-carbon-suave">
          {cod
            ? "Te escribimos por WhatsApp para confirmar tu pedido. Los pedidos están sujetos a disponibilidad."
            : "Pago seguro con Wompi: tarjeta, PSE, Nequi o Bancolombia."}
        </p>
      </aside>
    </form>
  );
}
