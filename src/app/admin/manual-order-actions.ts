"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import type { CartRequest } from "@/lib/cart/types";
import { CartError, cartRequestSchema, createManualOrder, customerSchema } from "@/lib/shop/orders";

export type ManualOrderState = { error?: string; fields?: Partial<Record<string, string>>; values?: Record<string, string> };

/** Registra un pedido a mano (venta por WhatsApp o en persona) y abre su página en el panel. */
export async function createManualOrderAction(_prev: ManualOrderState, form: FormData): Promise<ManualOrderState> {
  await requireAdmin();
  const values = Object.fromEntries([...form.entries()].filter(([k, v]) => k !== "lines" && typeof v === "string")) as Record<string, string>;

  // Los términos los acepta el cliente al comprar en la web; aquí la venta ya está acordada
  const customer = customerSchema.safeParse({ ...values, terms: "on" });
  if (!customer.success) {
    const fields: Record<string, string> = {};
    for (const issue of customer.error.issues) fields[String(issue.path[0])] ??= issue.message;
    return { values, fields, error: "Revisa los datos marcados." };
  }

  let lines: CartRequest;
  try {
    lines = cartRequestSchema.parse(JSON.parse(String(form.get("lines") ?? "[]")));
  } catch {
    return { values, error: "No se pudieron leer los productos. Recarga la página." };
  }
  if (lines.length === 0) return { values, error: "Agrega al menos un producto." };

  const paymentType = values.paymentType === "contraentrega" ? "contraentrega" : "transferencia";
  const delivery = values.delivery === "recoger" ? "recoger" : values.delivery === "nacional" ? "nacional" : "domicilio";
  let code: string;
  try {
    ({ code } = await createManualOrder(customer.data, lines, paymentType, delivery, Number(values.barrioId) || null, {
      notify: values.notify === "on",
    }));
  } catch (e) {
    if (e instanceof CartError) return { values, error: e.message };
    console.error("No se pudo registrar el pedido:", e);
    return { values, error: "No se pudo registrar el pedido. Inténtalo de nuevo." };
  }
  revalidatePath("/admin/pedidos");
  redirect(`/admin/pedidos/${code}`);
}
