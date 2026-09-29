const cop = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

/** 45000 → "$ 45.000" */
export function formatCOP(value: number) {
  return cop.format(value);
}
