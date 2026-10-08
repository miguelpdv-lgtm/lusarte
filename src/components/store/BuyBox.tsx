"use client";

import { useState } from "react";
import { MinusIcon, PlusIcon, WhatsAppIcon } from "@/components/ui/icons";
import { availableUnits, isOptionAvailable, type ProductOption } from "@/lib/catalog/types";
import { formatCOP } from "@/lib/format";
import { whatsappUrl } from "@/lib/site";

const MAX_QTY = 99;
const FEW = 3;

type Props = { name: string; options: ProductOption[]; personalization: string | null };

/** Presentación, cantidad, personalización y pedido. El carrito y el pago en línea llegan en la fase 6. */
export function BuyBox({ name, options, personalization }: Props) {
  const firstAvailable = options.find(isOptionAvailable) ?? options[0];
  const [optionId, setOptionId] = useState(firstAvailable.id);
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");

  const option = options.find((o) => o.id === optionId) ?? firstAvailable;
  const units = availableUnits(option);
  const max = Math.min(MAX_QTY, units);
  const available = units > 0;
  const showSelector = options.length > 1;

  const message = [
    `¡Hola Lusarte! Quiero pedir:`,
    `• ${name}${showSelector ? ` · ${option.name}` : ""} × ${qty}`,
    note.trim() && personalization ? `${personalization}: ${note.trim()}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <div className="grid gap-5">
      <div>
        <p className="font-display text-3xl font-extrabold tabular-nums">
          {formatCOP(option.price)}
          {option.compareAtPrice && (
            <s className="ml-2 text-base font-semibold text-carbon-suave">
              <span className="sr-only">Antes </span>
              {formatCOP(option.compareAtPrice)}
            </s>
          )}
        </p>
        <p className="mt-1 text-sm font-semibold" aria-live="polite">
          {!available ? (
            <span className="text-carbon-suave">Agotado por ahora</span>
          ) : units <= FEW ? (
            <span className="rounded-full bg-miel px-2 py-0.5">¡Quedan {units}!</span>
          ) : (
            <span className="text-carbon-suave">Disponible</span>
          )}
        </p>
      </div>

      {showSelector && (
        <fieldset>
          <legend className="text-sm font-bold">Presentación</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {options.map((o) => {
              const ok = isOptionAvailable(o);
              const selected = o.id === option.id;
              return (
                <label
                  key={o.id}
                  className={`cursor-pointer rounded-full border-2 px-3.5 py-2 text-sm font-bold transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-carbon ${
                    selected ? "border-carbon bg-carbon text-crema" : "border-carbon/30 bg-crema-claro hover:border-carbon"
                  } ${ok ? "" : "line-through opacity-50"}`}
                >
                  <input
                    type="radio"
                    name="presentacion"
                    value={o.id}
                    checked={selected}
                    onChange={() => {
                      setOptionId(o.id);
                      setQty(1);
                    }}
                    className="sr-only"
                  />
                  {o.name}
                  {!ok && <span className="sr-only"> (agotado)</span>}
                </label>
              );
            })}
          </div>
        </fieldset>
      )}

      {personalization && (
        <label className="grid gap-1.5">
          <span className="text-sm font-bold">{personalization}</span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            maxLength={300}
            placeholder="Cuéntanos cómo la quieres"
            className="rounded-2xl border-2 border-carbon/80 bg-white px-3 py-2 text-sm outline-none focus:shadow-[3px_3px_0_var(--color-carbon)]"
          />
        </label>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center rounded-full border-2 border-carbon bg-crema-claro" role="group" aria-label="Cantidad">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            disabled={qty <= 1 || !available}
            aria-label="Quitar uno"
            className="grid size-10 cursor-pointer place-items-center disabled:cursor-not-allowed disabled:opacity-35"
          >
            <MinusIcon className="size-4" />
          </button>
          <output className="min-w-8 text-center font-bold tabular-nums" aria-live="polite">
            {qty}
          </output>
          <button
            type="button"
            onClick={() => setQty((q) => Math.min(max, q + 1))}
            disabled={qty >= max || !available}
            aria-label="Agregar uno"
            className="grid size-10 cursor-pointer place-items-center disabled:cursor-not-allowed disabled:opacity-35"
          >
            <PlusIcon className="size-4" />
          </button>
        </div>

        {available ? (
          <a
            href={whatsappUrl(message)}
            target="_blank"
            rel="noopener noreferrer"
            className="toon toon-press inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-estrella px-6 py-3 text-sm font-bold sm:flex-none"
          >
            <WhatsAppIcon className="size-5" /> Pedir por WhatsApp
          </a>
        ) : (
          <a
            href={whatsappUrl(`¡Hola Lusarte! ¿Cuándo vuelve a estar disponible ${name}${showSelector ? ` (${option.name})` : ""}?`)}
            target="_blank"
            rel="noopener noreferrer"
            className="toon toon-press inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-crema px-6 py-3 text-sm font-bold sm:flex-none"
          >
            <WhatsAppIcon className="size-5" /> Avísame cuando llegue
          </a>
        )}
      </div>
    </div>
  );
}
