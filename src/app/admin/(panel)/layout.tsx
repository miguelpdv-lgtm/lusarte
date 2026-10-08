import type { Metadata } from "next";
import Link from "next/link";
import { logout } from "@/app/admin/actions";
import { Logo } from "@/components/brand/Logo";
import { AdminNav } from "@/components/admin/AdminNav";
import { requireAdmin } from "@/lib/auth/session";

export const metadata: Metadata = { title: { default: "Panel", template: "%s · Panel Lusarte" } };

export default async function PanelLayout({ children }: LayoutProps<"/admin">) {
  const admin = await requireAdmin();
  return (
    <div className="flex flex-1 flex-col bg-crema">
      <header className="sticky top-0 z-30 border-b-3 border-carbon bg-crema-claro">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
          <Link href="/admin" aria-label="Inicio del panel" className="shrink-0">
            <Logo className="h-7 w-auto text-carbon" />
          </Link>
          <AdminNav />
          <div className="ml-auto flex items-center gap-3 text-sm">
            <Link href="/" target="_blank" className="hidden font-semibold underline-offset-4 hover:underline sm:inline">
              Ver tienda
            </Link>
            <form action={logout}>
              <button type="submit" title={admin.email} className="cursor-pointer font-semibold underline-offset-4 hover:underline">
                Salir
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-8">{children}</main>
    </div>
  );
}
