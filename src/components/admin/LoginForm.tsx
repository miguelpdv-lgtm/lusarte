"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/app/admin/actions";
import { Field, inputClass } from "./Field";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  return (
    <form action={action} className="mt-6 grid gap-4">
      <Field label="Correo">
        <input name="email" type="email" autoComplete="username" required className={inputClass} />
      </Field>
      <Field label="Contraseña">
        <input name="password" type="password" autoComplete="current-password" required className={inputClass} />
      </Field>
      {state.error && (
        <p role="alert" className="rounded-xl bg-miel/60 px-3 py-2 text-sm font-semibold">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="toon toon-press mt-2 rounded-full bg-estrella px-6 py-3 text-sm font-bold disabled:opacity-60"
      >
        {pending ? "Ingresando…" : "Ingresar"}
      </button>
    </form>
  );
}
