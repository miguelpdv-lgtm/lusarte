import { getAdmin } from "@/lib/auth/session";
import { confirmationEmail, newSaleEmail, paymentFailedEmail, shippedEmail, type EmailKind } from "@/lib/email/templates";
import { getOrder } from "@/lib/shop/orders";

const build = { confirmacion: confirmationEmail, venta: newSaleEmail, despacho: shippedEmail, pago_fallido: paymentFailedEmail };

// Vista previa de un correo del pedido tal como lo recibe el destinatario (?texto=1 para la versión en texto plano).
export async function GET(req: Request, { params }: RouteContext<"/admin/pedidos/[codigo]/correo/[tipo]">) {
  if (!(await getAdmin())) return new Response("No autorizado", { status: 401 });
  const { codigo, tipo } = await params;
  const order = await getOrder(codigo);
  if (!order || !(tipo in build)) return new Response("No encontrado", { status: 404 });
  const email = build[tipo as EmailKind](order);
  if (new URL(req.url).searchParams.has("texto")) {
    return new Response(`Asunto: ${email.subject}\n\n${email.text}`, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
  return new Response(email.html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}
