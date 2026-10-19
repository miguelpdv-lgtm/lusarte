import { site } from "@/lib/site";

// Plantilla HTML de los correos con la marca de Lusarte.
// - Tablas y estilos en línea: es lo único que respetan Gmail y Outlook.
// - Tema claro y oscuro: "color-scheme" + @media (prefers-color-scheme: dark) (Apple Mail, iOS, Outlook app)
//   y [data-ogsc]/[data-ogsb] (Outlook.com). Gmail invierte por su cuenta: los colores se eligieron para que
//   sigan leyéndose bien invertidos (sin texto claro sobre fondo claro fijo).
// - Para no caer en spam: casi todo es texto real (pocas imágenes y livianas, con alt), versión de texto plano,
//   enlaces solo a lusarte.net / WhatsApp / Instagram (sin acortadores), asuntos sin mayúsculas ni signos de más,
//   y el remitente autenticado en Brevo (DKIM, SPF y DMARC: ver docs/CORREOS.md).

export const C = {
  crema: "#efebe0",
  cremaClaro: "#f7f4ec",
  carbon: "#383939",
  carbonSuave: "#5b5c5b",
  estrella: "#f5eca0",
  lavanda: "#dcc5e0",
  noche: "#2a2b2b",
};

const FONT = "'DM Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const DISPLAY = "'Bricolage Grotesque', 'DM Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif";

/** URL pública del sitio para enlaces e imágenes (en previews, PUBLIC_SITE_URL). */
export function siteUrl(path = "") {
  const base = (process.env.PUBLIC_SITE_URL?.trim() || site.url).replace(/\/+$/, "");
  return `${base}${path}`;
}

export function esc(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ─── Bloques ───

export const h1 = (text: string) =>
  `<h1 class="tx" style="margin:0 0 16px;font-family:${DISPLAY};font-size:26px;line-height:1.2;font-weight:800;color:${C.carbon};">${esc(text)}</h1>`;

export const h2 = (text: string) =>
  `<h2 class="tx" style="margin:28px 0 10px;font-family:${DISPLAY};font-size:17px;line-height:1.3;font-weight:800;color:${C.carbon};">${esc(text)}</h2>`;

/** Párrafo. Recibe HTML ya escapado (usar esc() con los datos del cliente). */
export const p = (html: string, muted = false) =>
  `<p class="${muted ? "mu" : "tx"}" style="margin:0 0 14px;font-family:${FONT};font-size:${muted ? 14 : 16}px;line-height:1.6;color:${muted ? C.carbonSuave : C.carbon};">${html}</p>`;

/** Botón a prueba de clientes de correo (tabla + enlace con relleno). */
export const button = (href: string, label: string) => `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0 8px;">
  <tr>
    <td align="center" bgcolor="${C.estrella}" style="border:3px solid ${C.carbon};border-radius:999px;background-color:${C.estrella};" class="btn">
      <a href="${esc(href)}" target="_blank" style="display:inline-block;padding:13px 26px;font-family:${FONT};font-size:15px;font-weight:700;line-height:1;color:${C.carbon};text-decoration:none;border-radius:999px;">${esc(label)}</a>
    </td>
  </tr>
</table>`;

/** Recuadro lavanda para datos destacados (dirección, guía). */
export const box = (html: string) => `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 6px;">
  <tr>
    <td class="box tx" bgcolor="${C.lavanda}" style="background-color:${C.lavanda};border-radius:16px;padding:16px 18px;font-family:${FONT};font-size:15px;line-height:1.6;color:${C.carbon};">${html}</td>
  </tr>
</table>`;

/** Filas etiqueta/valor (resumen del pedido). */
export function rows(items: { label: string; value: string; sub?: string; strong?: boolean }[], topLine = false) {
  const tr = items
    .map(
      (r, i) => `
  <tr>
    <td class="tx line" style="padding:10px 0;${i || topLine ? `border-top:1px solid #d9d3c3;` : ""}font-family:${FONT};font-size:${r.strong ? 17 : 15}px;line-height:1.45;color:${C.carbon};${r.strong ? "font-weight:800;" : ""}">
      ${r.label}${r.sub ? `<br><span class="mu" style="font-size:13px;color:${C.carbonSuave};">${r.sub}</span>` : ""}
    </td>
    <td class="tx line" align="right" style="padding:10px 0 10px 12px;${i || topLine ? `border-top:1px solid #d9d3c3;` : ""}font-family:${FONT};font-size:${r.strong ? 17 : 15}px;line-height:1.45;color:${C.carbon};white-space:nowrap;font-weight:${r.strong ? 800 : 700};vertical-align:top;">${r.value}</td>
  </tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 8px;">${tr}</table>`;
}

// ─── Documento ───

type LayoutInput = {
  /** Texto que se ve junto al asunto en la bandeja (no aparece en el cuerpo) */
  preheader: string;
  title: string;
  body: string;
  /** Por qué recibe este correo */
  reason: string;
};

export function layout({ preheader, title, body, reason }: LayoutInput) {
  const logo = siteUrl("/email/logo.png");
  const logoDark = siteUrl("/email/logo-claro.png");
  const vela = siteUrl("/email/vela.png");
  const wa = `https://wa.me/${site.whatsapp}`;
  const ig = `https://instagram.com/${site.instagram}`;

  return `<!doctype html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${esc(title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@800&family=DM+Sans:wght@400;700&display=swap" rel="stylesheet">
<style>
  :root { color-scheme: light dark; supported-color-schemes: light dark; }
  body { margin:0; padding:0; width:100% !important; -webkit-text-size-adjust:100%; }
  a { color:${C.carbon}; }
  @media (max-width: 600px) {
    .card { padding:26px 20px !important; border-radius:20px !important; }
    .wrap { padding:20px 12px !important; }
  }
  @media (prefers-color-scheme: dark) {
    .bg { background-color:${C.noche} !important; }
    .card { background-color:${C.carbon} !important; border-color:${C.crema} !important; }
    .tx, .tx a { color:${C.crema} !important; }
    .mu, .mu a { color:#cfc9bb !important; }
    .box { background-color:#4d4254 !important; }
    .line { border-color:#55575a !important; }
    .btn { border-color:${C.crema} !important; }
    .logo-l { display:none !important; }
    .logo-d { display:block !important; max-height:none !important; overflow:visible !important; }
  }
  [data-ogsc] .tx, [data-ogsc] .tx a { color:${C.crema} !important; }
  [data-ogsc] .mu { color:#cfc9bb !important; }
  [data-ogsb] .bg { background-color:${C.noche} !important; }
  [data-ogsb] .card { background-color:${C.carbon} !important; }
  [data-ogsb] .box { background-color:#4d4254 !important; }
</style>
</head>
<body class="bg" style="margin:0;padding:0;background-color:${C.crema};">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${C.crema};opacity:0;">${esc(preheader)}&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="bg" bgcolor="${C.crema}" style="background-color:${C.crema};">
  <tr>
    <td align="center" class="wrap" style="padding:32px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
        <tr>
          <td align="center" style="padding:0 0 22px;">
            <a href="${esc(siteUrl("/"))}" target="_blank" style="text-decoration:none;">
              <img class="logo-l" src="${logo}" width="180" height="57" alt="Lusarte" style="display:block;border:0;width:180px;height:auto;">
              <!--[if !mso]><!-->
              <div class="logo-d" style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
                <img src="${logoDark}" width="180" height="57" alt="Lusarte" style="display:block;border:0;width:180px;height:auto;">
              </div>
              <!--<![endif]-->
            </a>
          </td>
        </tr>
        <tr>
          <td class="card" bgcolor="${C.cremaClaro}" style="background-color:${C.cremaClaro};border:3px solid ${C.carbon};border-radius:24px;padding:34px 32px;">
            ${h1(title)}
            ${body}
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:26px 12px 0;">
            <img src="${vela}" width="36" height="56" alt="" style="display:block;border:0;width:36px;height:auto;margin:0 auto 12px;">
            <p class="tx" style="margin:0 0 6px;font-family:${FONT};font-size:14px;line-height:1.6;color:${C.carbon};font-weight:700;">${esc(site.name)} · ${esc(site.tagline)}</p>
            <p class="mu" style="margin:0 0 6px;font-family:${FONT};font-size:13px;line-height:1.6;color:${C.carbonSuave};">
              <a href="${wa}" target="_blank" style="color:${C.carbonSuave};">WhatsApp ${esc(site.phone)}</a> ·
              <a href="${ig}" target="_blank" style="color:${C.carbonSuave};">Instagram @${esc(site.instagram)}</a> ·
              <a href="${esc(siteUrl("/"))}" target="_blank" style="color:${C.carbonSuave};">lusarte.net</a>
            </p>
            <p class="mu" style="margin:0;font-family:${FONT};font-size:12px;line-height:1.6;color:${C.carbonSuave};">${esc(reason)}</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

/** Pie de la versión en texto plano. */
export function textFooter(reason: string) {
  return `\n\n—\n${site.name} · ${site.tagline}\nWhatsApp ${site.phone} · Instagram @${site.instagram} · ${siteUrl("/")}\n${reason}`;
}
