import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

/**
 * Revisa lo que el panel necesita en el servidor y devuelve los problemas en lenguaje claro.
 * Se muestra en la página de login para no tener que leer logs.
 */
export async function setupProblems() {
  const problems: string[] = [];
  const secret = process.env.AUTH_SECRET ?? "";
  if (secret.length < 32) {
    problems.push(
      secret ? "AUTH_SECRET es muy corto (mínimo 32 caracteres)." : "Falta la variable AUTH_SECRET (Secrets de GoDaddy). Sin ella no se puede iniciar sesión.",
    );
  }
  if (!process.env.EFFI_API_KEY) problems.push("Falta la variable EFFI_API_KEY: el panel no podrá sincronizar con Effi ni guardar precios allá.");

  try {
    const [rows] = await db.execute(sql`select table_name as t from information_schema.tables where table_schema = database()`);
    const tables = new Set((rows as unknown as { t: string }[]).map((r) => r.t));
    const missing = ["admin_users", "products", "product_options", "effi_articles", "effi_sales", "sync_state"].filter((t) => !tables.has(t));
    if (missing.length) problems.push(`A la base de datos le faltan tablas (${missing.join(", ")}): importa lusarte-base.sql desde la interfaz de GoDaddy.`);
    else {
      const [admins] = await db.execute(sql`select count(*) as n from admin_users`);
      if (Number((admins as unknown as { n: number }[])[0]?.n ?? 0) === 0) problems.push("No hay ningún usuario del panel: importa lusarte-base.sql o crea uno.");
    }
  } catch (e) {
    problems.push(`No hay conexión con la base de datos (${e instanceof Error ? e.message.split("\n")[0] : "error desconocido"}). Revisa que la app tenga su base MySQL asociada.`);
  }
  return problems;
}

export type StatusItem = { label: string; value: string; ok: boolean; hint?: string };

/** Estado de la configuración de la tienda (para el inicio del panel), en lenguaje claro. */
export async function storeStatus(): Promise<StatusItem[]> {
  const { wompiConfig } = await import("@/lib/shop/config");
  const { remisionesMode } = await import("@/lib/effi/sales");
  const { seoIndexing } = await import("@/lib/seo");
  const env = (k: string) => process.env[k]?.trim() ?? "";
  const items: StatusItem[] = [];

  // Wompi: las tres llaves deben ser del mismo ambiente
  const integ = env("WOMPI_INTEGRITY_SECRET");
  const events = env("WOMPI_EVENTS_SECRET");
  const cfg = wompiConfig();
  if (!cfg) items.push({ label: "Pagos (Wompi)", value: "Sin llaves", ok: false, hint: "Sin WOMPI_PUBLIC_KEY y WOMPI_INTEGRITY_SECRET el carrito solo ofrece pedir por WhatsApp." });
  else {
    const mode = cfg.sandbox ? "test" : "prod";
    const mismatched = [
      integ && !integ.startsWith(`${mode}_integrity_`) && "WOMPI_INTEGRITY_SECRET",
      events && !events.startsWith(`${mode}_events_`) && "WOMPI_EVENTS_SECRET",
    ].filter(Boolean);
    items.push({
      label: "Pagos (Wompi)",
      value: cfg.sandbox ? "Modo de pruebas" : "Producción: cobros reales",
      ok: mismatched.length === 0 && !!events,
      hint: mismatched.length
        ? `${mismatched.join(" y ")} no ${mismatched.length > 1 ? "son" : "es"} del mismo ambiente que la llave pública (${cfg.sandbox ? "pruebas" : "producción"}): los pagos fallarán. Copia las tres llaves del mismo modo en Wompi.`
        : !events
          ? "Falta WOMPI_EVENTS_SECRET: los pagos se confirmarán solo cuando el cliente vuelva a la tienda."
          : `URL de eventos en Wompi (modo ${cfg.sandbox ? "pruebas" : "producción"}): https://lusarte.net/api/wompi/webhook`,
    });
  }

  const brevo = !!env("BREVO_API_KEY");
  const admin = env("ADMIN_EMAIL");
  items.push({
    label: "Correos (Brevo)",
    value: brevo ? `Activos · avisos de venta a ${admin || "nadie"}` : "Sin configurar",
    ok: brevo && !!admin,
    hint: !brevo ? "Falta BREVO_API_KEY: los clientes no reciben correos." : !admin ? "Falta ADMIN_EMAIL: nadie recibe el aviso de venta nueva." : undefined,
  });

  const rem = remisionesMode();
  items.push({
    label: "Remisiones en Effi",
    value: rem.on ? "Automáticas" : "Apagadas",
    ok: rem.on || !!cfg?.sandbox,
    hint: rem.on ? "Cada pedido pagado o contraentrega confirmada crea su remisión." : rem.reason,
  });

  const indexing = seoIndexing();
  items.push({
    label: "Google (SEO)",
    value: indexing ? "Visible en buscadores" : "Oculto a buscadores",
    ok: indexing || !!cfg?.sandbox,
    hint: indexing
      ? "Registra lusarte.net/sitemap.xml en Google Search Console."
      : "Se activa solo al poner las llaves de producción de Wompi (o con SEO_INDEX=1).",
  });

  const legal = ["BUSINESS_LEGAL_NAME", "BUSINESS_NIT", "BUSINESS_ADDRESS", "BUSINESS_EMAIL"].filter((k) => !env(k));
  items.push({
    label: "Datos legales",
    value: legal.length ? "Incompletos" : "Completos",
    ok: legal.length === 0,
    hint: legal.length ? `Faltan ${legal.join(", ")}: se usan en los términos, la privacidad y el comprobante.` : undefined,
  });
  return items;
}
