"use client";

import Link from "next/link";

/** Error inesperado en el panel: en vez de la pantalla genérica, qué revisar. */
export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto grid max-w-xl flex-1 content-center gap-4 px-4 py-16">
      <h1 className="font-display text-2xl font-extrabold">El panel tuvo un problema</h1>
      <p className="text-carbon-suave">Casi siempre es la configuración del servidor. En la página de ingreso se ve qué falta (variables o tablas de la base).</p>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={reset} className="toon toon-press cursor-pointer rounded-full bg-estrella px-5 py-2.5 text-sm font-bold">
          Reintentar
        </button>
        <Link href="/admin/ingresar" className="toon toon-press rounded-full bg-crema-claro px-5 py-2.5 text-sm font-bold">
          Ver qué falta
        </Link>
      </div>
      {error.digest && <p className="text-xs text-carbon-suave">Código del error (para el log de GoDaddy): {error.digest}</p>}
    </main>
  );
}
