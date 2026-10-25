"use client";

import { useActionState } from "react";
import { saveNoticeEmails, type NoticeState } from "@/app/admin/notice-actions";
import { Field, inputClass } from "./Field";

export function NoticeEmailsForm({ current, envEmails }: { current: string[]; envEmails: string[] }) {
  const [state, action, pending] = useActionState<NoticeState, FormData>(saveNoticeEmails, {});
  return (
    <form action={action} className="grid gap-4">
      <Field
        label="Correos para el aviso de venta nueva"
        hint={
          <>
            Separa varios con coma. Si lo dejas vacío se usa el de GoDaddy (ADMIN_EMAIL)
            {envEmails.length ? `: ${envEmails.join(", ")}` : ", que hoy está vacío"}.
          </>
        }
      >
        <input name="emails" type="text" inputMode="email" autoComplete="off" defaultValue={current.join(", ")} className={inputClass} />
      </Field>
      {state.error && (
        <p role="alert" className="rounded-xl bg-miel/60 px-3 py-2 text-sm font-semibold">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p role="status" className="rounded-xl bg-oliva/40 px-3 py-2 text-sm font-semibold">
          {state.ok}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="toon toon-press justify-self-start rounded-full bg-estrella px-6 py-3 text-sm font-bold disabled:opacity-60"
      >
        {pending ? "Guardando…" : "Guardar correos"}
      </button>
    </form>
  );
}
