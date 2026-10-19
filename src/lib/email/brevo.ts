import "server-only";

// Envío de correos transaccionales con Brevo (https://developers.brevo.com/reference/sendtransacemail).
// El remitente (EMAIL_FROM) debe ser de un dominio verificado en Brevo (DKIM + DMARC en el DNS de lusarte.net).

export type Recipient = { email: string; name?: string };

export type Email = {
  to: Recipient[];
  subject: string;
  html: string;
  text: string;
  /** Etiqueta para filtrar en el panel de Brevo */
  tag: string;
  replyTo?: Recipient;
};

export class EmailNotConfigured extends Error {}

export function emailConfig() {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  if (!apiKey) return null;
  return {
    apiKey,
    from: { email: process.env.EMAIL_FROM?.trim() || "pedidos@lusarte.net", name: process.env.EMAIL_FROM_NAME?.trim() || "Lusarte" },
    replyTo: process.env.EMAIL_REPLY_TO?.trim() || null,
  };
}

/** Correos que reciben el aviso de venta nueva (ADMIN_EMAIL, separados por coma). */
export function adminRecipients(): Recipient[] {
  return (process.env.ADMIN_EMAIL ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
    .map((email) => ({ email }));
}

/** Envía un correo. Devuelve el messageId de Brevo; lanza si falla. */
export async function sendEmail(email: Email): Promise<string> {
  const cfg = emailConfig();
  if (!cfg) throw new EmailNotConfigured("Falta BREVO_API_KEY (ver .env.example)");

  const replyTo = email.replyTo ?? (cfg.replyTo ? { email: cfg.replyTo, name: cfg.from.name } : undefined);
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": cfg.apiKey, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      sender: cfg.from,
      to: email.to,
      replyTo,
      subject: email.subject,
      htmlContent: email.html,
      textContent: email.text,
      tags: [email.tag],
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });

  const json = (await res.json().catch(() => null)) as { messageId?: string; message?: string } | null;
  if (!res.ok) {
    const hint =
      res.status === 401 && /ip address/i.test(json?.message ?? "")
        ? " (Brevo bloquea esta IP: agrégala en Brevo → Seguridad → IP autorizadas, o desactiva el bloqueo de IPs)"
        : res.status === 401
          ? " (la API key de Brevo es inválida)"
          : "";
    throw new Error(`Brevo respondió ${res.status}: ${json?.message ?? "sin detalle"}${hint}`);
  }
  return json?.messageId ?? "";
}
