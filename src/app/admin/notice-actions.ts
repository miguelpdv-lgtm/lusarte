"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { savePanelAdminEmails } from "@/lib/email/admin-emails";
import { parseEmails } from "@/lib/email/brevo";

export type NoticeState = { ok?: string; error?: string };

/** Guarda los correos que reciben el aviso de venta nueva. Vacío = volver a ADMIN_EMAIL de GoDaddy. */
export async function saveNoticeEmails(_prev: NoticeState, form: FormData): Promise<NoticeState> {
  await requireAdmin();
  const raw = String(form.get("emails") ?? "").trim();
  const words = raw.split(/[,;\s]+/).filter(Boolean);
  const valid = parseEmails(raw).map((r) => r.email.toLowerCase());
  const bad = words.filter((w) => !valid.includes(w.toLowerCase()));
  if (bad.length) return { error: `"${bad[0]}" no parece un correo. Revisa que esté bien escrito.` };
  const emails = [...new Set(valid)];
  if (emails.length > 5) return { error: "Máximo 5 correos." };
  await savePanelAdminEmails(emails);
  revalidatePath("/admin", "layout");
  return {
    ok: emails.length
      ? `Listo: los avisos de venta llegarán a ${emails.join(", ")}.`
      : "Listo: sin correos en el panel, se usa el de GoDaddy (ADMIN_EMAIL).",
  };
}
