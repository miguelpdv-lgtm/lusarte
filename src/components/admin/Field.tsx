import type { ReactNode } from "react";

export const inputClass =
  "w-full rounded-xl border-2 border-carbon/80 bg-white px-3 py-2.5 text-[0.95rem] outline-none transition-shadow focus:shadow-[3px_3px_0_var(--color-carbon)] focus-visible:outline-none";

/** Etiqueta + control + ayuda opcional. Envuelve el control en <label> para no depender de ids. */
export function Field({ label, hint, children, className = "" }: { label: string; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <label className={`grid gap-1.5 ${className}`}>
      <span className="text-sm font-bold">{label}</span>
      {children}
      {hint && <span className="text-xs text-carbon-suave">{hint}</span>}
    </label>
  );
}
