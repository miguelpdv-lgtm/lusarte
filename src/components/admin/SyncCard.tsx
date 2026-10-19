"use client";

import { useActionState } from "react";
import { syncNow, type SyncActionState } from "@/app/admin/actions";

type Status = { label: string; at: string | null; ok: boolean; detail: string | null };

const ago = (iso: string) => {
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (min < 1) return "hace un momento";
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  return h < 24 ? `hace ${h} h` : `hace ${Math.round(h / 24)} días`;
};

/** Estado de la conexión con Effi y botón para sincronizar a mano. */
export function SyncCard({ statuses }: { statuses: Status[] }) {
  const [state, action, pending] = useActionState<SyncActionState>(syncNow, {});
  const failing = statuses.some((s) => !s.ok);
  return (
    <section className={`toon grid gap-3 rounded-[1.5rem] p-4 sm:p-5 ${failing ? "bg-miel/60" : "bg-crema-claro"}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-extrabold">Conexión con Effi</h2>
          <p className="text-sm text-carbon-suave">Productos, precios, stock y ventas salen de Effi. Se actualiza sola cada 15 minutos.</p>
        </div>
        <form action={action}>
          <button type="submit" disabled={pending} className="toon toon-press cursor-pointer rounded-full bg-estrella px-4 py-2 text-sm font-bold disabled:cursor-wait disabled:opacity-60">
            {pending ? "Sincronizando…" : "Sincronizar ahora"}
          </button>
        </form>
      </div>
      <ul className="grid gap-1 text-sm sm:grid-cols-2">
        {statuses.map((s) => (
          <li key={s.label} className="flex gap-2">
            <span aria-hidden="true">{s.ok ? "●" : "▲"}</span>
            <span>
              <strong>{s.label}:</strong> {s.at ? ago(s.at) : "nunca"}
              {s.detail && <span className="block text-xs text-carbon-suave">{s.detail}</span>}
            </span>
          </li>
        ))}
      </ul>
      {state.message && (
        <p role="status" className="rounded-xl bg-oliva/40 px-3 py-2 text-sm font-semibold">
          Listo: {state.message}
        </p>
      )}
      {state.error && (
        <p role="alert" className="rounded-xl bg-miel px-3 py-2 text-sm font-semibold">
          {state.error}
        </p>
      )}
    </section>
  );
}
