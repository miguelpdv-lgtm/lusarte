import "server-only";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { adminRecipients, parseEmails, type Recipient } from "./brevo";

// Correos del aviso de venta nueva, editables desde Panel → Mi cuenta y guardados en settings["avisos"].
// Si en el panel no hay ninguno, se usa ADMIN_EMAIL (variable de GoDaddy).

const KEY = "avisos";
const avisosSchema = z.object({ adminEmails: z.array(z.string()).max(5) });

/** Los guardados en el panel (vacío si no hay o si falla la base). */
export async function getPanelAdminEmails(): Promise<string[]> {
  try {
    const [row] = await db.select().from(schema.settings).where(eq(schema.settings.key, KEY)).limit(1);
    if (row) {
      const parsed = avisosSchema.safeParse(JSON.parse(row.value));
      if (parsed.success) return parsed.data.adminEmails;
    }
  } catch {
    // Sin base o JSON dañado: se usa ADMIN_EMAIL
  }
  return [];
}

export async function savePanelAdminEmails(emails: string[]) {
  const json = JSON.stringify(avisosSchema.parse({ adminEmails: emails }));
  await db.insert(schema.settings).values({ key: KEY, value: json }).onDuplicateKeyUpdate({ set: { value: json } });
}

/** Quién recibe el aviso de venta: los del panel o, si no hay, ADMIN_EMAIL. */
export async function saleNoticeRecipients(): Promise<{ to: Recipient[]; source: "panel" | "env" }> {
  const panel = parseEmails((await getPanelAdminEmails()).join(","));
  return panel.length ? { to: panel, source: "panel" } : { to: adminRecipients(), source: "env" };
}
