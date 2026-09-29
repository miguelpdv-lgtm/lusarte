"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CloseIcon, MenuIcon, WhatsAppIcon } from "@/components/ui/icons";
import { nav, whatsappUrl } from "@/lib/site";

export function MobileMenu() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="-ml-2 grid size-11 place-items-center rounded-full hover:bg-carbon/5"
        aria-label="Abrir menú"
        aria-expanded={open}
        aria-controls="menu-movil"
      >
        <MenuIcon className="size-6" />
      </button>

      <div
        className={`fixed inset-0 z-50 bg-carbon/40 transition-opacity ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      <div
        id="menu-movil"
        role="dialog"
        aria-modal="true"
        aria-label="Menú"
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(20rem,85vw)] flex-col bg-crema p-6 shadow-2xl transition-transform duration-300 ${open ? "translate-x-0" : "-translate-x-full"}`}
        inert={!open}
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="-mr-2 -mt-2 ml-auto grid size-11 place-items-center rounded-full hover:bg-carbon/5"
          aria-label="Cerrar menú"
        >
          <CloseIcon className="size-6" />
        </button>

        <nav aria-label="Menú móvil" className="-mx-2 mt-2 overflow-y-auto">
          <ul className="space-y-1">
            {nav.map((item) => (
              <li key={item.label}>
                {item.children ? (
                  <>
                    <p className="eyebrow px-3 pt-2 pb-1 text-carbon-suave">{item.label}</p>
                    <ul className="mb-2">
                      {item.children.map((child) => (
                        <li key={child.href + child.label}>
                          <Link
                            href={child.href}
                            onClick={() => setOpen(false)}
                            className="block rounded-xl px-3 py-2 font-display text-lg font-semibold hover:bg-carbon/5"
                          >
                            {child.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`block rounded-xl px-3 py-2.5 font-display text-2xl font-semibold hover:bg-carbon/5 ${
                      item.highlight ? "text-carbon" : ""
                    }`}
                  >
                    {item.highlight && <span aria-hidden="true">✦ </span>}
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <a
          href={whatsappUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto flex items-center justify-center gap-2 rounded-full bg-carbon px-6 py-3.5 text-sm font-semibold text-crema"
        >
          <WhatsAppIcon className="size-5" />
          Escríbenos por WhatsApp
        </a>
      </div>
    </div>
  );
}
