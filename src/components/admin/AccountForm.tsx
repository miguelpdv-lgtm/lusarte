"use client";

import { useActionState } from "react";
import { updateAccount, type AccountState } from "@/app/admin/actions";
import { Field, inputClass } from "./Field";

export function AccountForm({ email }: { email: string }) {
  const [state, action, pending] = useActionState<AccountState, FormData>(updateAccount, {});
  return (
    <form action={action} className="grid gap-4">
      <Field label="Correo para ingresar">
        <input name="email" type="email" autoComplete="username" required defaultValue={email} className={inputClass} />
      </Field>
      <Field label="Contraseña nueva" hint="Mínimo 12 caracteres. Déjala vacía si solo cambias el correo.">
        <input name="password" type="password" autoComplete="new-password" minLength={12} className={inputClass} />
      </Field>
      <Field label="Repite la contraseña nueva">
        <input name="confirm" type="password" autoComplete="new-password" className={inputClass} />
      </Field>
      <Field label="Contraseña actual" hint="Para confirmar que eres tú.">
        <input name="current" type="password" autoComplete="current-password" required className={inputClass} />
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
        {pending ? "Guardando…" : "Guardar cambios"}
      </button>
    </form>
  );
}
