import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { ChevronIcon, InstagramIcon, WhatsAppIcon } from "@/components/ui/icons";
import { categories, categoryHref, navidad } from "@/data/catalog";
import { site, whatsappUrl } from "@/lib/site";

const columns = [
  {
    title: "Tienda",
    links: [
      ...categories.map((c) => ({ label: c.short, href: categoryHref(c) })),
      { label: navidad.name, href: navidad.href },
    ],
  },
  {
    title: "Ayuda",
    links: [
      { label: "Cómo comprar", href: "/como-comprar" },
      { label: "Preguntas frecuentes", href: "/preguntas-frecuentes" },
      { label: "Envíos, cambios y garantías", href: "/envios-y-devoluciones" },
      { label: "Contacto", href: "/contacto" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Términos y condiciones", href: "/terminos" },
      { label: "Tratamiento de datos", href: "/privacidad" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="wave-top relative overflow-hidden bg-carbon text-crema">
      <div className="pattern pointer-events-none absolute inset-0 text-crema/[0.05]" aria-hidden="true" />

      <div className="relative mx-auto max-w-7xl px-4 pt-20 pb-8 sm:px-6 md:pt-24 lg:px-8">
        <div className="grid gap-10 md:gap-12 lg:grid-cols-[1.4fr_2fr]">
          <div>
            <Logo tagline className="h-16 w-auto text-crema" />
            <p className="mt-6 max-w-xs text-sm leading-relaxed text-crema/70">
              Velas artesanales e insumos para hacer velas. Hecho a mano en Colombia.
            </p>
            <div className="mt-6 flex gap-2">
              <a
                href={whatsappUrl()}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="grid size-11 place-items-center rounded-full border border-crema/20 transition-colors hover:bg-crema hover:text-carbon"
              >
                <WhatsAppIcon className="size-5" />
              </a>
              <a
                href={`https://instagram.com/${site.instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="grid size-11 place-items-center rounded-full border border-crema/20 transition-colors hover:bg-crema hover:text-carbon"
              >
                <InstagramIcon className="size-5" />
              </a>
            </div>
          </div>

          {/* Celular: columnas plegables */}
          <div className="divide-y divide-crema/15 border-y border-crema/15 md:hidden">
            {columns.map((col) => (
              <details key={col.title} className="group">
                <summary className="eyebrow flex cursor-pointer list-none items-center justify-between py-4 text-crema/70 [&::-webkit-details-marker]:hidden">
                  {col.title}
                  <ChevronIcon className="size-4 transition-transform group-open:rotate-180" />
                </summary>
                <ul className="grid grid-cols-2 gap-x-4 gap-y-3 pb-5 text-sm">
                  {col.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="text-crema/85 transition-colors hover:text-miel">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </div>

          {/* Tablet y escritorio: columnas abiertas */}
          <div className="hidden grid-cols-3 gap-8 md:grid">
            {columns.map((col) => (
              <div key={col.title}>
                <h2 className="eyebrow text-crema/60">{col.title}</h2>
                <ul className="mt-4 space-y-3 text-sm">
                  {col.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="text-crema/85 transition-colors hover:text-miel">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 pt-2 md:mt-16 md:border-t md:border-crema/15 md:pt-6 text-xs text-crema/60 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Lusarte. Todos los derechos reservados.</p>
          <p>Pagos seguros con Wompi · Tarjetas, PSE, Nequi y Bancolombia</p>
        </div>
      </div>
    </footer>
  );
}
