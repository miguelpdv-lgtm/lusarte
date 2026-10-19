/** Etiquetas y colores de los estados del pedido en el panel. */
export const ORDER_STATUS = {
  pendiente_pago: { label: "Pendiente de pago", tint: "bg-miel/60" },
  pagado: { label: "Pagado · por despachar", tint: "bg-oliva/50" },
  rechazado: { label: "Pago rechazado", tint: "bg-carbon/10" },
  despachado: { label: "Despachado", tint: "bg-cielo/50" },
} as const;

export const statusInfo = (s: string) => ORDER_STATUS[s as keyof typeof ORDER_STATUS] ?? { label: s, tint: "bg-carbon/10" };
