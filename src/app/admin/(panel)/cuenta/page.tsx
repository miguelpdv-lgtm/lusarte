import type { Metadata } from "next";
import { AccountForm } from "@/components/admin/AccountForm";
import { NoticeEmailsForm } from "@/components/admin/NoticeEmailsForm";
import { requireAdmin } from "@/lib/auth/session";
import { getPanelAdminEmails } from "@/lib/email/admin-emails";
import { adminRecipients } from "@/lib/email/brevo";

export const metadata: Metadata = { title: "Mi cuenta" };

export default async function CuentaPage() {
  const admin = await requireAdmin();
  const noticeEmails = await getPanelAdminEmails();
  return (
    <div className="grid max-w-md gap-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold">Mi cuenta</h1>
        <p className="mt-1 text-sm text-carbon-suave">Cambia el correo y la contraseña con los que entras al panel.</p>
      </div>
      <div className="toon rounded-[1.5rem] bg-crema-claro p-5 sm:p-6">
        <AccountForm email={admin.email} />
      </div>

      <div id="avisos">
        <h2 className="font-display text-2xl font-extrabold">Avisos de venta</h2>
        <p className="mt-1 text-sm text-carbon-suave">
          A quién le llega el correo de cada venta nueva. Para reenviar un aviso, abre el pedido y pulsa «Reenviar» junto a «Nueva venta».
        </p>
      </div>
      <div className="toon rounded-[1.5rem] bg-crema-claro p-5 sm:p-6">
        <NoticeEmailsForm current={noticeEmails} envEmails={adminRecipients().map((r) => r.email)} />
      </div>
    </div>
  );
}
