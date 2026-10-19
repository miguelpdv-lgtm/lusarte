"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Inicio" },
  { href: "/admin/productos", label: "Productos" },
  { href: "/admin/pedidos", label: "Pedidos" },
];

export function AdminNav() {
  const path = usePathname();
  return (
    <nav aria-label="Panel" className="flex gap-1 text-sm font-bold">
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
