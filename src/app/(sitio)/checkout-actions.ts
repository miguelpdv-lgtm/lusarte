"use server";

import { headers } from "next/headers";
import type { CartRequest, QuotedLine } from "@/lib/cart/types";
import { getCatalog } from "@/lib/catalog/queries";
import { checkoutEnabled } from "@/lib/shop/config";
import { CartError, cartRequestSchema, createOrder, customerSchema, quoteLines } from "@/lib/shop/orders";
import { cityNames, findCity, findDepartment } from "@/lib/shop/places";
import { deliveryOptions, type DeliveryOption } from "@/lib/shop/shipping";
import { checkoutUrl } from "@/lib/shop/wompi";

/** Precios y disponibilidad vigentes del carrito (catálogo en caché: solo para mostrar). */
export async function quoteCart(lines: CartRequest): Promise<QuotedLine[]> {
  const parsed = cartRequestSchema.safeParse(lines);
  if (!parsed.success) return [];
  return quoteLines(await getCatalog(), parsed.data);
}

export type CheckoutState = {
  error?: string;
  fields?: Partial<Record<string, string>>;
  values?: Record<string, string>;
  /** URL de Wompi a la que se redirige el navegador */
  payUrl?: string;
  /** Contraentrega: página del pedido confirmado */
  orderUrl?: string;
};

async function origin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "lusarte.net";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  return `${proto}://${host}`;
}

/** Valida los datos, crea el pedido con precios del servidor y devuelve la URL de pago de Wompi. */
export async function placeOrder(_prev: CheckoutState, form: FormData): Promise<CheckoutState> {
  const values = Object.fromEntries([...form.entries()].filter(([k, v]) => k !== "cart" && typeof v === "string")) as Record<string, string>;
  if (!checkoutEnabled()) return { values, error: "El pago en línea aún no está activo. Puedes hacer tu pedido por WhatsApp." };

  const customer = customerSchema.safeParse(values);
  if (!customer.success) {
    const fields: Record<string, string> = {};
    for (const issue of customer.error.issues) fields[String(issue.path[0])] ??= issue.message;
    return { values, fields, error: "Revisa los datos marcados." };
  }

  let lines: CartRequest;
  try {
    lines = cartRequestSchema.parse(JSON.parse(String(form.get("cart") ?? "[]")));
  } catch {
    return { values, error: "No pudimos leer tu carrito. Recarga la página e inténtalo de nuevo." };
  }

  try {
    const paymentType = values.paymentType === "contraentrega" ? "contraentrega" : "wompi";
    const delivery = values.delivery === "recoger" ? "recoger" : values.delivery === "nacional" ? "nacional" : "domicilio";
    const order = await createOrder(customer.data, lines, paymentType, delivery);
    if (paymentType === "contraentrega") return { orderUrl: `/pedido/${order.code}?t=${order.token}` };
    const c = customer.data;
    const payUrl = checkoutUrl({
      reference: order.code,
      amount: order.total,
      redirectUrl: `${await origin()}/pedido/${order.code}?t=${order.token}`,
      customer: { email: c.email, name: c.name, phone: c.phone, legalId: c.legalId, legalIdType: c.legalIdType },
      shipping: { address: c.address, city: c.city, region: c.department, name: c.name, phone: c.phone },
    });
    return { payUrl };
  } catch (e) {
    if (e instanceof CartError) return { values, error: e.message };
    console.error("No se pudo crear el pedido:", e);
    return { values, error: "Algo falló al crear tu pedido. Inténtalo de nuevo en un momento o escríbenos por WhatsApp." };
  }
}

/** Municipios del departamento elegido (para autocompletar en el checkout). */
export async function citiesFor(departmentId: number): Promise<string[]> {
  return Number.isInteger(departmentId) ? cityNames(departmentId) : [];
}

/** Opciones de entrega (domicilio, recoger o nacional) para el municipio elegido; null si el municipio no es válido. */
export async function shippingFor(departmentId: number, city: string): Promise<DeliveryOption[] | null> {
  if (!Number.isInteger(departmentId) || !findDepartment(departmentId)) return null;
  const place = findCity(departmentId, city);
  return place ? deliveryOptions(place.id) : null;
}
