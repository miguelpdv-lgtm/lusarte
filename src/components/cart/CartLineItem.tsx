"use client";

import Image from "next/image";
import Link from "next/link";
import { BrandIcon } from "@/components/ui/BrandIcon";
import { MinusIcon, PlusIcon } from "@/components/ui/icons";
import { cart } from "@/lib/cart/store";
import { lineKey, MAX_QTY, type CartLine } from "@/lib/cart/types";
import { formatCOP } from "@/lib/format";

type Props = {
  line: CartLine;
  /** Unidades disponibles según el servidor (null = sin límite, undefined = aún no se sabe) */
  max?: number | null;
  /** El producto ya no se puede comprar */
  unavailable?: boolean;
  compact?: boolean;
  onNavigate?: () => void;
};

export function CartLineItem({ line, max, unavailable = false, compact = false, onNavigate }: Props) {
  const key = lineKey(line);
  const limit = Math.min(MAX_QTY, max ?? MAX_QTY);
  const over = !unavailable && max != null && line.quantity > max;
  const href = `/producto/${line.slug}`;

  return (
    <li className={`flex gap-3 ${compact ? "py-3" : "py-4"}`}>
      <Link
        href={href}
        onClick={onNavigate}
        className={`relative shrink-0 overflow-hidden rounded-xl border-2 border-carbon bg-lavanda ${compact ? "size-16" : "size-20 sm:size-24"} ${unavailable ? "grayscale" : ""}`}
      >
        {line.image ? (
          <Image src={line.image} alt="" fill sizes="96px" className="object-cover" />
        ) : (
          <span className="grid size-full place-items-center">
            <BrandIcon src="/brand/icon-vela-ondulada.svg" className="size-1/2 text-carbon/60" />
          </span>
        )}
      </Link>

      <div className="grid min-w-0 flex-1 gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link href={href} onClick={onNavigate} className="line-clamp-2 leading-snug font-bold hover:underline">
              {line.productName}
            </Link>
            {line.optionName && <p className="text-sm text-carbon-suave">{line.optionName}</p>}
            {line.note && <p className="mt-0.5 line-clamp-2 text-xs text-carbon-suave italic">“{line.note}”</p>}
          </div>
          <p className="shrink-0 font-bold tabular-nums">{formatCOP(line.price * line.quantity)}</p>
        </div>

        {unavailable ? (
          <p className="text-sm font-bold text-alerta">Ya no está disponible</p>
        ) : over ? (
          <p className="text-sm font-bold text-alerta">{max === 0 ? "Se agotó" : `Solo quedan ${max}`}</p>
        ) : null}

        <div className="flex items-center justify-between gap-2">
          {unavailable ? (
            <span />
          ) : (
            <div className="flex items-center rounded-full border-2 border-carbon bg-crema-claro" role="group" aria-label={`Cantidad de ${line.productName}`}>
              <button
                type="button"
                onClick={() => cart.setQuantity(key, line.quantity - 1)}
                disabled={line.quantity <= 1}
                aria-label="Quitar uno"
                className="grid size-8 cursor-pointer place-items-center disabled:cursor-not-allowed disabled:opacity-35"
              >
                <MinusIcon className="size-3.5" />
              </button>
              <output className="min-w-7 text-center text-sm font-bold tabular-nums">{line.quantity}</output>
              <button
                type="button"
                onClick={() => cart.setQuantity(key, Math.min(limit, line.quantity + 1))}
                disabled={line.quantity >= limit}
                aria-label="Agregar uno"
                className="grid size-8 cursor-pointer place-items-center disabled:cursor-not-allowed disabled:opacity-35"
              >
                <PlusIcon className="size-3.5" />
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={() => cart.remove(key)}
            className="cursor-pointer text-sm font-semibold text-carbon-suave underline-offset-4 hover:text-carbon hover:underline"
          >
            Quitar
          </button>
        </div>
      </div>
    </li>
  );
}
