"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Inicio" },
  { href: "/admin/productos", label: "Productos" },
  { href: "/admin/pedidos", label: "Pedidos" },
  { href: "/admin/envios", label: "Envíos" },
  { href: "/admin/portada", label: "Portada" },
];

export function AdminNav() {
  const path = usePathname();
  return (
    // En celular va en su propia fila (order-last) y se desliza de lado si no cabe
    <nav aria-label="Panel" className="order-last -mx-4 flex w-[calc(100%+2rem)] gap-1 overflow-x-auto px-4 text-sm font-bold whitespace-nowrap md:order-none md:mx-0 md:w-auto md:overflow-visible md:px-0">
      {links.map((l) => {
        const active = l.href === "/admin" ? path === "/admin" : path.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-full px-3 py-1.5 transition-colors ${active ? "bg-carbon text-crema" : "hover:bg-lavanda"}`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
