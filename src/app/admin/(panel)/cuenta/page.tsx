import type { Metadata } from "next";
import { AccountForm } from "@/components/admin/AccountForm";
import { requireAdmin } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Mi cuenta" };

export default async function CuentaPage() {
  const admin = await requireAdmin();
  return (
    <div className="grid max-w-md gap-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold">Mi cuenta</h1>
        <p className="mt-1 text-sm text-carbon-suave">Cambia el correo y la contraseña con los que entras al panel.</p>
      </div>
      <div className="toon rounded-[1.5rem] bg-crema-claro p-5 sm:p-6">
        <AccountForm email={admin.email} />
      </div>
    </div>
  );
}
