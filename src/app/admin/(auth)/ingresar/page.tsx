import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { LoginForm } from "@/components/admin/LoginForm";
import { getAdmin } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Ingresar al panel" };

export default async function IngresarPage() {
  if (await getAdmin()) redirect("/admin");
  return (
    <main className="grid flex-1 place-items-center bg-lavanda px-4 py-16">
      <div className="toon toon-shadow w-full max-w-sm rounded-[1.75rem] bg-crema-claro p-6 sm:p-8">
        <Logo className="h-9 w-auto text-carbon" />
        <h1 className="mt-6 font-display text-2xl font-extrabold">Panel de la tienda</h1>
        <p className="mt-1 text-sm text-carbon-suave">Ingresa para editar productos y despachar pedidos.</p>
        <LoginForm />
      </div>
    </main>
  );
}
