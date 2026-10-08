import type { ReactNode } from "react";
import { Breadcrumbs } from "./Breadcrumbs";

type Props = {
  title: string;
  intro?: ReactNode;
  /** Texto provisional que la clienta debe revisar: se avisa arriba */
  draft?: boolean;
  children: ReactNode;
};

/** Página de texto (nosotros, ayuda, legales) con el estilo de la marca. */
export function InfoPage({ title, intro, draft = false, children }: Props) {
  return (
    <>
      <header className="wave-bottom bg-lavanda px-4 pt-8 pb-14 sm:px-6 sm:pt-10 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <Breadcrumbs items={[{ label: title }]} />
          <h1 className="mt-3 font-hand text-[2.5rem] leading-none text-balance sm:text-5xl">{title}</h1>
          {intro && <p className="mt-3 max-w-2xl leading-relaxed text-carbon/85">{intro}</p>}
        </div>
      </header>
      <div className="mx-auto max-w-3xl px-4 pt-8 pb-20 sm:px-6 lg:px-8">
        {draft && (
          <p role="note" className="toon mb-8 rounded-2xl bg-miel/50 px-4 py-3 text-sm font-semibold">
            Texto provisional, pendiente de revisión por Lusarte.
          </p>
        )}
        <div className="grid gap-5 leading-relaxed text-carbon/90 [&_a]:font-bold [&_a]:underline [&_a]:decoration-2 [&_a]:underline-offset-4 [&_h2]:mt-4 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-extrabold [&_li]:mt-1 [&_ul]:list-disc [&_ul]:pl-5">
          {children}
        </div>
      </div>
    </>
  );
}
