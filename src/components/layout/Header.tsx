import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { CartButton } from "@/components/cart/CartButton";
import { ChevronIcon, SearchIcon } from "@/components/ui/icons";
import { nav } from "@/lib/site";
import { MobileMenu } from "./MobileMenu";

const linkClass =
  "relative py-2 transition-colors after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:origin-left after:scale-x-0 after:rounded-full after:bg-carbon after:transition-transform hover:after:scale-x-100";

export function Header() {
  return (
    <>
      <div className="bg-carbon px-4 py-2 text-center text-crema">
        <p className="eyebrow text-[0.65rem] sm:text-xs">
          Envíos a toda Colombia <span className="mx-2 hidden text-miel sm:inline">✦</span>
          <span className="hidden sm:inline">Paga con tarjeta, PSE o Nequi</span>
        </p>
      </div>

      {/* El fondo va en ::before y se extiende 33px bajo el header con borde ondulado, que acompaña al hacer scroll.
          (Nada de filtros en el <header>: atraparían el menú móvil, que es position: fixed.) */}
      <header className="sticky top-0 z-40 before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:-bottom-[33px] before:-z-10 before:bg-crema before:wave-bottom">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:h-20 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 lg:w-48">
            <MobileMenu />
            <Link href="/" className="text-carbon" aria-label="Lusarte, ir al inicio">
              <Logo className="h-8 w-auto sm:h-10" />
            </Link>
          </div>

          <nav aria-label="Principal" className="hidden lg:block">
            <ul className="flex items-center gap-8 text-sm font-semibold">
              {nav.map((item) =>
                item.children ? (
                  // Desplegable solo con CSS: se abre con hover y con foco de teclado
                  <li key={item.label} className="group relative">
                    <Link href={item.href} className={`${linkClass} inline-flex items-center gap-1`} aria-haspopup="true">
                      {item.label}
                      <ChevronIcon className="size-4 transition-transform group-focus-within:rotate-180 group-hover:rotate-180" />
                    </Link>
                    <div className="invisible absolute top-full left-1/2 -translate-x-1/2 pt-4 opacity-0 transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                      <ul className="toon toon-shadow w-64 rounded-[1.25rem] bg-crema-claro p-2">
                        {item.children.map((child, i) => (
                          <li key={child.href + child.label}>
                            <Link
                              href={child.href}
                              className={`block rounded-xl px-3 py-2.5 transition-colors hover:bg-lavanda ${
                                i === item.children!.length - 1 ? "mt-1 border-t-2 border-carbon/10 pt-3 text-carbon-suave" : ""
                              }`}
                            >
                              {child.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </li>
                ) : item.highlight ? (
                  <li key={item.label}>
                    <Link href={item.href} className="toon inline-flex items-center gap-1.5 rounded-full bg-estrella px-3.5 py-1">
                      <span aria-hidden="true">✦</span> {item.label}
                    </Link>
                  </li>
                ) : (
                  <li key={item.label}>
                    <Link href={item.href} className={linkClass}>
                      {item.label}
                    </Link>
                  </li>
                ),
              )}
            </ul>
          </nav>

          <div className="flex items-center justify-end gap-1 lg:w-48">
            <Link
              href="/tienda"
              className="grid size-11 place-items-center rounded-full transition-colors hover:bg-carbon/5"
              aria-label="Buscar productos"
            >
              <SearchIcon className="size-5" />
            </Link>
            <CartButton />
          </div>
        </div>
      </header>
    </>
  );
}
