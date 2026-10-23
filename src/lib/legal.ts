import "server-only";
import { site } from "@/lib/site";

/**
 * Datos del responsable para los textos legales y el comprobante. Salen de variables de entorno (BUSINESS_*):
 * el repositorio es público y no deben quedar escritos en el código.
 */
export function business() {
  const env = (k: string) => process.env[k]?.trim() || "";
  return {
    tradeName: site.name,
    legalName: env("BUSINESS_LEGAL_NAME") || site.name,
    nit: env("BUSINESS_NIT"),
    regime: env("BUSINESS_REGIME"),
    address: env("BUSINESS_ADDRESS"),
    // Sin correo de contacto: los textos y el comprobante solo muestran teléfono y WhatsApp
    email: env("BUSINESS_EMAIL"),
    phone: site.phone,
    whatsapp: site.whatsapp,
    domain: site.url.replace(/^https?:\/\//, ""),
  };
}
