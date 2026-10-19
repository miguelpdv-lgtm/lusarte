"use client";

import { useEffect, useState } from "react";
import { quoteCart } from "@/app/(sitio)/checkout-actions";
import { cart } from "@/lib/cart/store";
import { lineKey, type CartLine, type QuotedLine } from "@/lib/cart/types";

/**
 * Pide al servidor precio y disponibilidad vigentes de las líneas del carrito y actualiza la copia local.
 * Devuelve null mientras no hay respuesta.
 */
export function useQuote(lines: CartLine[], enabled = true) {
  const [quote, setQuote] = useState<Map<string, QuotedLine> | null>(null);
  // Solo vuelve a consultar si cambian las presentaciones (no las cantidades)
  const keys = [...new Set(lines.map(lineKey))].sort();
  const signature = keys.length ? JSON.stringify(keys) : "";

  useEffect(() => {
    if (!enabled || !signature) return;
    let alive = true;
    const request = (JSON.parse(signature) as string[]).map((k) => {
      const [optionId, ...note] = k.split("|");
      return { optionId: Number(optionId), quantity: 1, note: note.join("|") };
    });
    quoteCart(request)
      .then((res) => {
        if (!alive) return;
        const map = new Map(res.map((q) => [q.key, q]));
        setQuote(map);
        const updates = new Map(
          res.filter((q) => q.ok).map((q) => [q.key, { price: q.price, productName: q.productName, optionName: q.optionName, slug: q.slug, image: q.image }]),
        );
        cart.patch(updates);
      })
      .catch(() => alive && setQuote(null));
    return () => {
      alive = false;
    };
  }, [signature, enabled]);

  return signature ? quote : new Map<string, QuotedLine>();
}

/** Estado de una línea según la cotización. */
export function lineStatus(quote: Map<string, QuotedLine> | null, line: CartLine) {
  const q = quote?.get(lineKey(line));
  if (!q) return { max: undefined, unavailable: false, blocked: false };
  const unavailable = !q.ok;
  const blocked = unavailable || (q.max !== null && line.quantity > q.max);
  return { max: q.max, unavailable, blocked };
}
