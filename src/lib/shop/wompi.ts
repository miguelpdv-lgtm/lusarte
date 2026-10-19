import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { wompiConfig } from "./config";

// Wompi Web Checkout + eventos. Ver https://docs.wompi.co/docs/colombia/widget-checkout-web/ y …/eventos/

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

type CheckoutInput = {
  reference: string;
  amount: number;
  redirectUrl: string;
  customer: { email: string; name: string; phone: string; legalId?: string | null };
  shipping: { address: string; city: string; region: string; name: string; phone: string };
};

/** URL del Web Checkout de Wompi, con la firma de integridad calculada aquí (el secreto nunca sale del servidor). */
export function checkoutUrl(input: CheckoutInput) {
  const cfg = wompiConfig();
  if (!cfg) throw new Error("Faltan las llaves de Wompi (ver .env.example)");
  const cents = input.amount * 100;
  const params = new URLSearchParams({
    "public-key": cfg.publicKey,
    currency: "COP",
    "amount-in-cents": String(cents),
    reference: input.reference,
    "signature:integrity": sha256(`${input.reference}${cents}COP${cfg.integritySecret}`),
    "redirect-url": input.redirectUrl,
    "customer-data:email": input.customer.email,
    "customer-data:full-name": input.customer.name,
    "customer-data:phone-number": input.customer.phone,
    "shipping-address:address-line-1": input.shipping.address,
    "shipping-address:country": "CO",
    "shipping-address:city": input.shipping.city,
    "shipping-address:region": input.shipping.region,
    "shipping-address:name": input.shipping.name,
    "shipping-address:phone-number": input.shipping.phone,
  });
  if (input.customer.legalId) {
    params.set("customer-data:legal-id", input.customer.legalId);
    params.set("customer-data:legal-id-type", "CC");
  }
  return `https://checkout.wompi.co/p/?${params}`;
}

export type WompiTransaction = {
  id: string;
  status: "PENDING" | "APPROVED" | "DECLINED" | "VOIDED" | "ERROR";
  reference: string;
  amount_in_cents: number;
  currency: string;
  payment_method_type?: string;
};

type WompiEvent = {
  event: string;
  data: Record<string, unknown>;
  signature?: { properties?: string[]; checksum?: string };
  timestamp?: number;
};

/** Valida el checksum del evento: valores de signature.properties + timestamp + secreto de eventos, en SHA-256. */
export function verifyEvent(body: WompiEvent) {
  const secret = wompiConfig()?.eventsSecret;
  const { properties, checksum } = body.signature ?? {};
  if (!secret || !properties?.length || !checksum || body.timestamp === undefined) return false;
  const values = properties.map((path) => path.split(".").reduce<unknown>((v, k) => (v as Record<string, unknown> | undefined)?.[k], body.data));
  const expected = Buffer.from(sha256(`${values.map((v) => String(v ?? "")).join("")}${body.timestamp}${secret}`));
  const got = Buffer.from(checksum.toLowerCase());
  return expected.length === got.length && timingSafeEqual(expected, got);
}

/** Consulta una transacción en la API de Wompi (respaldo si el webhook tarda o no llega). */
export async function fetchTransaction(id: string): Promise<WompiTransaction | null> {
  const cfg = wompiConfig();
  if (!cfg || !/^[\w-]{1,60}$/.test(id)) return null;
  try {
    const res = await fetch(`${cfg.apiBase}/transactions/${encodeURIComponent(id)}`, { cache: "no-store", signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: WompiTransaction };
    return json.data ?? null;
  } catch {
    return null;
  }
}
