import { getAdmin } from "@/lib/auth/session";
import { receiptPdf } from "@/lib/email/receipt";
import { getOrder } from "@/lib/shop/orders";

// Comprobante del pedido en PDF (el mismo que va adjunto a los correos).
export async function GET(_req: Request, { params }: RouteContext<"/admin/pedidos/[codigo]/comprobante">) {
  if (!(await getAdmin())) return new Response("No autorizado", { status: 401 });
  const order = await getOrder((await params).codigo);
  if (!order || !["pagado", "contraentrega", "despachado", "entregado"].includes(order.status)) return new Response("No encontrado", { status: 404 });
  return new Response(new Uint8Array(await receiptPdf(order)), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="Lusarte-${order.code}.pdf"`, "Cache-Control": "no-store" },
  });
}
