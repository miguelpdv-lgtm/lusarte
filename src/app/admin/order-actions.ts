"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { createRemision, noteShipment } from "@/lib/effi/sales";
import { sendOrderEmail } from "@/lib/email/order-emails";
import type { EmailKind } from "@/lib/email/templates";
import { CartError, getOrder, shipmentSchema, shipOrder } from "@/lib/shop/orders";

export type ShipState = { error?: string; fields?: Partial<Record<string, string>>; ok?: string };

/** Despachar (o corregir la guía). El correo al cliente sale la primera vez, o si se marca "enviar de nuevo". */
export async function ship(code: string, _prev: ShipState, form: FormData): Promise<ShipState> {
  await requireAdmin();
  const parsed = shipmentSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) fields[String(issue.path[0])] ??= issue.message;
    return { fields, error: "Revisa los datos marcados." };
  }
  try {
    const { first } = await shipOrder(code, parsed.data);
    await noteShipment(code);
    const notify = first || form.get("notify") === "on";
    if (notify) await sendOrderEmail(code, "despacho", { force: !first });
    revalidatePath(`/admin/pedidos/${code}`);
    revalidatePath("/admin/pedidos");
    return { ok: first ? "Pedido despachado." : notify ? "Guía actualizada y correo enviado de nuevo." : "Guía actualizada." };
  } catch (e) {
    if (e instanceof CartError) return { error: e.message };
    console.error("No se pudo despachar:", e);
    return { error: "No se pudo guardar. Inténtalo de nuevo." };
  }
}

const RESENDABLE: Record<string, EmailKind[]> = {
  pagado: ["confirmacion", "venta"],
  despachado: ["confirmacion", "venta", "despacho"],
  rechazado: ["pago_fallido"],
};

/** Reenvía un correo del pedido desde el panel. */
export async function resendEmail(code: string, kind: EmailKind) {
  await requireAdmin();
  const order = await getOrder(code);
  if (!order || !RESENDABLE[order.status]?.includes(kind)) return;
  await sendOrderEmail(code, kind, { force: true });
  revalidatePath(`/admin/pedidos/${code}`);
}

/** Crea (o reintenta) la remisión en Effi de un pedido pagado. */
export async function retryRemision(code: string) {
  await requireAdmin();
  await createRemision(code);
  revalidatePath(`/admin/pedidos/${code}`);
}
