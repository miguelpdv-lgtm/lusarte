import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { storeStatus } from "@/lib/setup-check";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Desarrollo" };

export default async function Desarrollo() {
  await requireAdmin();
  const status = await storeStatus();

  return (
    <div className="grid grid-cols-1 gap-8">
      <div>
        <h1 className="font-display text-3xl font-extrabold">Desarrollo</h1>
        <p className="mt-1 text-carbon-suave">Configuración técnica de la tienda: pagos, correos, Effi, Google y fotos.</p>
      </div>

      <section aria-labelledby="estado" className="toon grid gap-3 rounded-[1.25rem] bg-crema-claro p-5">
        <h2 id="estado" className="font-display text-lg font-extrabold">
          Estado de la tienda
        </h2>
        <ul className="grid gap-2 text-sm">
          {status.map((i) => (
            <li key={i.label} className="grid gap-0.5 sm:grid-cols-[11rem_1fr]">
              <span className="font-bold">{i.label}</span>
              <span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${i.ok ? "bg-oliva/50" : "bg-miel"}`}>{i.value}</span>
                {i.hint && <span className="mt-0.5 block text-xs text-carbon-suave">{i.hint}</span>}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
