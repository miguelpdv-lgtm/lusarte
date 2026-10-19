import { applyTransaction } from "@/lib/shop/orders";
import { verifyEvent, type WompiTransaction } from "@/lib/shop/wompi";

// Eventos de Wompi (transaction.updated). Se configura en el dashboard de Wompi → Desarrolladores →
// URL de eventos: https://<dominio>/api/wompi/webhook (una para sandbox y otra para producción).
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || !verifyEvent(body)) return new Response("Firma inválida", { status: 401 });

  if (body.event === "transaction.updated") {
    const t = (body.data as { transaction?: WompiTransaction }).transaction;
    // Si algo falla se responde 500 y Wompi reintenta (30 min, 3 h, 24 h); aplicarlo de nuevo es seguro
    if (t?.reference) await applyTransaction(t);
  }
  return Response.json({ ok: true });
}
