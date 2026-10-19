import { categoryHref, insumos, navidad, velas } from "@/data/catalog";

// Contacto tomado del catálogo de la clienta (bit.ly/Lusartecatalogo).
// TODO(clienta): confirmar el correo (lusarte.net aún no tiene buzón) y el link de Facebook.
export const site = {
  name: "Lusarte",
  tagline: "Iluminando tu vida",
  url: "https://lusarte.net",
  description:
    "Insumos para hacer velas —ceras, parafinas, fragancias, moldes y recipientes— y velas artesanales hechas a mano. Envíos a toda Colombia y pagos seguros.",
  whatsapp: "573024296320", // formato internacional sin "+"
  phone: "302 429 6320",
  instagram: "lus_arte",
  email: "hola@lusarte.net",
} as const;

export function whatsappUrl(message = "¡Hola Lusarte! Quiero hacer un pedido.") {
  return `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(message)}`;
}

export type NavItem = {
  label: string;
  href: string;
  children?: { label: string; href: string }[];
  highlight?: boolean;
};

export const nav: NavItem[] = [
  {
    label: "Insumos",
    href: "/tienda",
    children: [
      ...insumos.map((c) => ({ label: c.short, href: categoryHref(c) })),
      { label: "Ver toda la tienda", href: "/tienda" },
    ],
  },
  { label: velas.short, href: categoryHref(velas) },
  { label: navidad.name, href: navidad.href, highlight: true },
];
