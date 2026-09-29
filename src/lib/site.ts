import { categoryHref, insumos, navidad, velas } from "@/data/catalog";

// TODO(clienta): reemplazar los datos de contacto marcados como pendientes.
export const site = {
  name: "Lusarte",
  tagline: "Iluminando tu vida",
  url: "https://lusarte.net",
  description:
    "Insumos para hacer velas —ceras, parafinas, fragancias, moldes y recipientes— y velas artesanales hechas a mano. Envíos a toda Colombia y pagos seguros.",
  whatsapp: "573000000000", // pendiente: número real, formato internacional sin "+"
  instagram: "lusarte", // pendiente: usuario real
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
  { label: "Nosotros", href: "/nosotros" },
];
