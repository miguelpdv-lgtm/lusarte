import "server-only";

/** Tarifa fija nacional de envío (COP). TODO(clienta): confirmar el valor; mientras tanto es provisional. */
export function shippingCost() {
  const n = Number(process.env.SHIPPING_FLAT_COP);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : 15000;
}

/** Llaves de Wompi. Sin ellas el checkout no se muestra y la tienda sigue pidiendo por WhatsApp. */
export function wompiConfig() {
  const publicKey = process.env.WOMPI_PUBLIC_KEY?.trim();
  const integritySecret = process.env.WOMPI_INTEGRITY_SECRET?.trim();
  if (!publicKey || !integritySecret) return null;
  return {
    publicKey,
    integritySecret,
    eventsSecret: process.env.WOMPI_EVENTS_SECRET?.trim() || null,
    /** pub_test_… = sandbox; pub_prod_… = producción */
    sandbox: publicKey.startsWith("pub_test_"),
    apiBase: publicKey.startsWith("pub_test_") ? "https://sandbox.wompi.co/v1" : "https://production.wompi.co/v1",
  };
}

export const checkoutEnabled = () => wompiConfig() !== null;
