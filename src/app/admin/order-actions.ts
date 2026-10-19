"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { annulRemision, createRemision, noteShipment } from "@/lib/effi/sales";
import { sendOrderEmail } from "@/lib/email/order-emails";
import type { EmailKind } from "@/lib/email/templates";
import { cancelCodOrder, CartError, confirmCodOrder, getOrder, markDelivered, shipLocal, shipmentSchema, shipOrder } from "@/lib/shop/orders";

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
  por_confirmar: ["recibido", "venta"],
  contraentrega: ["confirmacion", "venta"],
  despachado: ["confirmacion", "venta", "despacho"],
  entregado: ["confirmacion", "venta", "despacho"],
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

export type LocalState = { error?: string; ok?: string };

/** Despacho local: franja de entrega (de la lista o escrita) y nota; avisa al cliente la primera vez. */
export async function shipLocalAction(code: string, _prev: LocalState, form: FormData): Promise<LocalState> {
  await requireAdmin();
  const preset = String(form.get("window") ?? "");
  const custom = String(form.get("customWindow") ?? "").trim();
  const window = (preset === "otra" ? custom : preset).slice(0, 80);
  if (!window) return { error: "Elige o escribe la franja de entrega." };
  const note = String(form.get("note") ?? "").trim().slice(0, 500) || null;
  try {
    const { first } = await shipLocal(code, window, note);
    await noteShipment(code);
    const notify = first || form.get("notify") === "on";
    if (notify) await sendOrderEmail(code, "despacho", { force: !first });
    revalidatePath(`/admin/pedidos/${code}`);
    revalidatePath("/admin/pedidos");
    return { ok: first ? "Despachado: le avisamos al cliente la franja." : notify ? "Franja actualizada y correo reenviado." : "Franja actualizada." };
  } catch (e) {
    if (e instanceof CartError) return { error: e.message };
    console.error("No se pudo despachar (local):", e);
    return { error: "No se pudo guardar. Inténtalo de nuevo." };
  }
}

/** Entregado (y cobrado, si es contraentrega). */
export async function deliverAction(code: string) {
  await requireAdmin();
  await markDelivered(code);
  revalidatePath(`/admin/pedidos/${code}`);
  revalidatePath("/admin/pedidos");
}

/** Anula un pedido contraentrega no entregado: primero la remisión en Effi (devuelve el inventario), luego el pedido. */
export async function cancelCodAction(code: string, _prev: LocalState, form: FormData): Promise<LocalState> {
  await requireAdmin();
  const reason = String(form.get("reason") ?? "").trim().slice(0, 150) || "el cliente no recibió el pedido";
  // Validar antes de tocar Effi: solo contraentregas que no se han entregado
  const order = await getOrder(code);
  if (!order || order.paymentType !== "contraentrega" || !["por_confirmar", "contraentrega", "despachado"].includes(order.status))
    return { error: "Solo se anulan pedidos contraentrega que aún no se entregaron." };
  try {
    await annulRemision(code, reason);
    await cancelCodOrder(code);
  } catch (e) {
    if (e instanceof CartError) return { error: e.message };
    return { error: `Effi no anuló la remisión: ${e instanceof Error ? e.message : String(e)}. Anúlala en Effi y vuelve a intentar.` };
  }
  revalidatePath(`/admin/pedidos/${code}`);
  revalidatePath("/admin/pedidos");
  return { ok: "Pedido anulado." };
}

/** Confirma una contraentrega coordinada con el cliente: aparta el stock, crea la remisión y le avisa. */
export async function confirmCodAction(code: string) {
  await requireAdmin();
  try {
    await confirmCodOrder(code);
  } catch (e) {
    if (!(e instanceof CartError)) throw e;
  }
  revalidatePath(`/admin/pedidos/${code}`);
  revalidatePath("/admin/pedidos");
}
