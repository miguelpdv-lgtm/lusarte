/** Etiquetas y colores de los estados del pedido en el panel. */
export const ORDER_STATUS = {
  pendiente_pago: { label: "Pendiente de pago", tint: "bg-miel/60" },
  pagado: { label: "Pagado · por despachar", tint: "bg-oliva/50" },
  por_confirmar: { label: "Contraentrega · por confirmar", tint: "bg-miel" },
  contraentrega: { label: "Contraentrega · por entregar", tint: "bg-lavanda" },
  rechazado: { label: "Pago rechazado", tint: "bg-carbon/10" },
  despachado: { label: "Despachado", tint: "bg-cielo/50" },
  entregado: { label: "Entregado", tint: "bg-oliva/30" },
  cancelado: { label: "Anulado", tint: "bg-carbon/10" },
} as const;

export const statusInfo = (s: string) => ORDER_STATUS[s as keyof typeof ORDER_STATUS] ?? { label: s, tint: "bg-carbon/10" };
