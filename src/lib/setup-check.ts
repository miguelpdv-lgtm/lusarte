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
