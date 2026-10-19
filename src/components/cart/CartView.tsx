"use client";

import Link from "next/link";
import { WhatsAppIcon } from "@/components/ui/icons";
import { cartSubtotal, useCart } from "@/lib/cart/store";
import { cartWhatsappMessage } from "@/lib/cart/message";
import { lineKey } from "@/lib/cart/types";
import { formatCOP } from "@/lib/format";
import { whatsappUrl } from "@/lib/site";
import { CartLineItem } from "./CartLineItem";
import { lineStatus, useQuote } from "./useQuote";

type Props = { shipping: number; checkoutEnabled: boolean };

export function CartView({ shipping, checkoutEnabled }: Props) {
  const lines = useCart();
  const quote = useQuote(lines);
  const blocked = lines.some((l) => lineStatus(quote, l).blocked);
  const subtotal = cartSubtotal(lines);

  if (lines.length === 0) {
    return (
      <div className="toon rounded-[1.75rem] bg-crema-claro px-6 py-12 text-center">
        <p className="font-hand text-3xl">Tu carrito está vacío</p>
        <p className="mt-2 text-carbon-suave">Date una vuelta por la tienda y encuentra lo que necesitas para tus velas.</p>
        <Link href="/tienda" className="toon toon-press mt-6 inline-block rounded-full bg-estrella px-6 py-3 text-sm font-bold">
          Ver la tienda
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
      <ul className="toon divide-y-2 divide-carbon/10 rounded-[1.75rem] bg-crema-claro px-4 sm:px-6">
        {lines.map((l) => {
          const s = lineStatus(quote, l);
          return <CartLineItem key={lineKey(l)} line={l} max={s.max} unavailable={s.unavailable} />;
        })}
      </ul>

      <aside className="toon toon-shadow grid gap-3 rounded-[1.75rem] bg-crema-claro p-5 lg:sticky lg:top-32">
        <h2 className="font-display text-xl font-extrabold">Resumen</h2>
        <dl className="grid gap-2 text-sm">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd className="font-bold tabular-nums">{formatCOP(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Envío a toda Colombia</dt>
            <dd className="font-bold tabular-nums">{formatCOP(shipping)}</dd>
          </div>
          <div className="mt-1 flex justify-between border-t-2 border-carbon/10 pt-3 text-base">
            <dt className="font-bold">Total</dt>
            <dd className="font-display text-xl font-extrabold tabular-nums">{formatCOP(subtotal + shipping)}</dd>
          </div>
        </dl>

        {blocked && (
          <p role="alert" className="rounded-xl bg-miel/60 px-3 py-2 text-sm font-semibold">
            Ajusta los productos marcados para continuar.
          </p>
        )}

        {checkoutEnabled ? (
          blocked ? (
            <span className="toon cursor-not-allowed rounded-full bg-carbon/10 px-6 py-3 text-center text-sm font-bold text-carbon/50">Continuar al pago</span>
          ) : (
            <Link href="/checkout" className="toon toon-press rounded-full bg-estrella px-6 py-3 text-center text-sm font-bold">
              Continuar al pago
            </Link>
          )
        ) : (
          <>
            <p className="text-sm text-carbon-suave">Muy pronto podrás pagar en línea. Por ahora, envíanos tu pedido por WhatsApp.</p>
            <a
              href={whatsappUrl(cartWhatsappMessage(lines))}
              target="_blank"
              rel="noopener noreferrer"
              className="toon toon-press inline-flex items-center justify-center gap-2 rounded-full bg-estrella px-6 py-3 text-sm font-bold"
            >
              <WhatsAppIcon className="size-5" /> Pedir por WhatsApp
            </a>
          </>
        )}
        {checkoutEnabled && <p className="text-xs text-carbon-suave">Paga con tarjeta, PSE, Nequi o Bancolombia a través de Wompi.</p>}
      </aside>
    </div>
  );
}
