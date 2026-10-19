import "server-only";

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
