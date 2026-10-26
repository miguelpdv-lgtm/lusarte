import { formatCOP } from "@/lib/format";

/**
 * Comisión del pago en línea (Wompi). Desde 150.000 pesos (productos + domicilio) la asume el cliente:
 * se suma al total y se cobra en Wompi. Pagar al recibir o por transferencia no la lleva.
 */
export const ONLINE_FEE = { threshold: 150_000, percent: 3.69, fixed: 700 } as const;

/** Comisión en pesos para un pago en línea de `base` (0 si no llega al mínimo). */
export function onlineFee(base: number) {
  if (base < ONLINE_FEE.threshold) return 0;
  return Math.round((base * ONLINE_FEE.percent) / 100 + ONLINE_FEE.fixed);
}

/** "3,69% + $ 700" */
export const onlineFeeRate = () => `${String(ONLINE_FEE.percent).replace(".", ",")}% + ${formatCOP(ONLINE_FEE.fixed)}`;
export const ONLINE_FEE_LABEL = "Comisión pago en línea";
