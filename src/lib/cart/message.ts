import { formatCOP } from "@/lib/format";
import type { CartLine } from "./types";

/** Pedido por WhatsApp con todo el carrito (cuando el pago en línea no está activo). */
export function cartWhatsappMessage(lines: CartLine[]) {
  return [
    "¡Hola Lusarte! Quiero pedir:",
    ...lines.map(
      (l) => `• ${l.productName}${l.optionName ? ` · ${l.optionName}` : ""} × ${l.quantity}${l.note ? ` (${l.note})` : ""} — ${formatCOP(l.price * l.quantity)}`,
    ),
  ].join("\n");
}
