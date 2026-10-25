"use client";

/* eslint-disable @next/next/no-img-element -- vista previa de un archivo local (blob:), sin optimizar */
import { useActionState, useEffect, useState } from "react";
import { resetHeroPhoto, saveHeroPhoto, type HeroState } from "@/app/admin/hero-actions";
import type { HeroSlot } from "@/lib/home/hero";
import { shrink } from "./shrink";

type Props = {
  slot: HeroSlot;
  title: string;
  hint: string;
  /** Foto que se ve hoy en la tienda */
  current: { src: string; custom: boolean };
  /** Proporción del recuadro en la tienda, p. ej. "21/9" */
  aspect: string;
  /** Encuadre del recorte, igual que en la tienda */
  position: string;
  resetLabel: string;
};

export function HeroPhotoForm({ slot, title, hint, current, aspect, position, resetLabel }: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const [state, upload, uploading] = useActionState<HeroState, FormData>(async (prev, data) => {
    const file = data.get("file");
    if (file instanceof File && file.size > 0) data.set("file", await shrink(file, slot === "desktop" ? 2400 : 1600));
    const res = await saveHeroPhoto(prev, data);
    if (res.ok) setPreview(null);
    return res;
  }, {});
  const [resetState, reset, resetting] = useActionState<HeroState, FormData>(resetHeroPhoto, {});

  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);

  return (
    <section className="toon grid gap-4 rounded-[1.5rem] bg-crema-claro p-5 sm:p-6">
      <div>
        <h2 className="font-display text-xl font-extrabold">{title}</h2>
        <p className="mt-1 text-sm text-carbon-suave">{hint}</p>
      </div>

      <div className="relative overflow-hidden rounded-xl border-2 border-carbon/20 bg-[#c9b0c6]" style={{ aspectRatio: aspect }}>
        <img src={preview ?? current.src} alt="" className="size-full object-cover" style={{ objectPosition: position }} />
        <span className="absolute top-2 left-2 rounded-full bg-carbon px-2.5 py-1 text-xs font-bold text-crema">
          {preview ? "Vista previa (sin guardar)" : current.custom ? "Foto actual" : "Foto original"}
        </span>
      </div>

      <form action={upload} className="grid gap-3 sm:flex sm:flex-wrap sm:items-center">
        <input type="hidden" name="slot" value={slot} />
        <input
          type="file"
          name="file"
          accept="image/jpeg,image/png,image/webp"
          required
          onChange={(e) => {
            const f = e.target.files?.[0];
            setPreview(f ? URL.createObjectURL(f) : null);
          }}
          className="text-sm file:mr-3 file:cursor-pointer file:rounded-full file:border-2 file:border-carbon file:bg-white file:px-4 file:py-2 file:font-bold"
        />
        <button
          type="submit"
          disabled={uploading || !preview}
          className="toon toon-press justify-self-start rounded-full bg-estrella px-6 py-2.5 text-sm font-bold disabled:opacity-60"
        >
          {uploading ? "Subiendo…" : "Guardar foto"}
        </button>
      </form>

      {current.custom && (
        <form action={reset}>
          <input type="hidden" name="slot" value={slot} />
          <button type="submit" disabled={resetting} className="cursor-pointer text-sm font-semibold underline underline-offset-4 disabled:opacity-60">
            {resetting ? "Quitando…" : resetLabel}
          </button>
        </form>
      )}

      {!uploading && <Message state={state} />}
      {!resetting && <Message state={resetState} />}
    </section>
  );
}

function Message({ state }: { state: HeroState }) {
  if (state.error)
    return (
      <p role="alert" className="rounded-xl bg-miel/60 px-3 py-2 text-sm font-semibold">
        {state.error}
      </p>
    );
  if (state.ok)
    return (
      <p role="status" className="rounded-xl bg-oliva/40 px-3 py-2 text-sm font-semibold">
        {state.ok}
      </p>
    );
  return null;
}
