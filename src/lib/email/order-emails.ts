import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { getOrder, type OrderWithItems } from "@/lib/shop/orders";
import { receiptPdf } from "./receipt";
import { saleNoticeRecipients } from "./admin-emails";
import { EmailNotConfigured, sendEmail, type Recipient } from "./brevo";
import { confirmationEmail, newSaleEmail, paymentFailedEmail, receivedEmail, shippedEmail, type EmailKind, type Rendered } from "./templates";

const build: Record<EmailKind, (o: OrderWithItems) => Rendered> = {
  recibido: receivedEmail,
  confirmacion: confirmationEmail,
  venta: newSaleEmail,
  despacho: shippedEmail,
  pago_fallido: paymentFailedEmail,
};

async function recipients(kind: EmailKind, o: OrderWithItems): Promise<Recipient[]> {
  return kind === "venta" ? (await saleNoticeRecipients()).to : [{ email: o.email, name: o.name }];
}

/**
 * Envía un correo del pedido y lo deja en email_log. Nunca lanza: si falla, queda "fallido" para reenviar
 * desde el panel, y el pago o el despacho no se afectan.
 * Sin force, no repite un correo que ya salió (el webhook y la página de confirmación pueden llegar a la vez).
 */
export async function sendOrderEmail(code: string, kind: EmailKind, { force = false } = {}) {
  try {
    const order = await getOrder(code);
    if (!order) return;
    if (!force) {
      const [sent] = await db
        .select({ id: schema.emailLog.id })
        .from(schema.emailLog)
        .where(and(eq(schema.emailLog.orderId, order.id), eq(schema.emailLog.kind, kind), eq(schema.emailLog.status, "enviado")))
        .limit(1);
      if (sent) return;
    }

    const to = await recipients(kind, order);
    const recipient = to.map((r) => r.email).join(", ") || "(sin destinatario)";
    const log = (status: string, extra: { providerId?: string; error?: string } = {}) =>
      db.insert(schema.emailLog).values({ orderId: order.id, kind, recipient: recipient.slice(0, 500), status, ...extra, error: extra.error?.slice(0, 500) });

    if (to.length === 0) {
      await log("fallido", { error: "No hay destinatario (ponlo en Panel → Mi cuenta → Avisos de venta)" });
      return;
    }
    try {
      const attachments =
        kind === "confirmacion" || kind === "venta" ? [{ name: `Lusarte-${order.code}.pdf`, content: await receiptPdf(order) }] : undefined;
      const providerId = await sendEmail({ ...build[kind](order), to, tag: kind, attachments });
      await log("enviado", { providerId });
    } catch (e) {
      if (e instanceof EmailNotConfigured) await log("sin_configurar", { error: e.message });
      else {
        console.error(`Correo ${kind} de ${code} falló:`, e);
        await log("fallido", { error: e instanceof Error ? e.message : String(e) });
      }
    }
  } catch (e) {
    console.error(`No se pudo procesar el correo ${kind} de ${code}:`, e);
  }
}

/** Último intento de cada tipo de correo del pedido (para el panel). */
export async function emailStatus(orderId: number) {
  const list = await db.select().from(schema.emailLog).where(eq(schema.emailLog.orderId, orderId)).orderBy(desc(schema.emailLog.createdAt), desc(schema.emailLog.id));
  const latest = new Map<string, (typeof list)[number]>();
  for (const row of list) if (!latest.has(row.kind)) latest.set(row.kind, row);
  return latest;
}
