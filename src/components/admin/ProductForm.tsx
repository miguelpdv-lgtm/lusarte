"use client";

import Image from "next/image";
import { useActionState, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { deleteProduct, saveProduct, uploadProductImage, type ProductInput, type SaveState } from "@/app/admin/actions";
import { categories } from "@/data/catalog";
import type { Product } from "@/lib/catalog/types";
import { Field, inputClass } from "./Field";

type OptionRow = { key: string; id: number | null; name: string; price: string; compareAtPrice: string; stock: string; soldOut: boolean };
type ImageRow = { key: string; id: number | null; file: string; url: string; alt: string; width: number; height: number };
type Upload = { key: string; name: string; error?: string };

const DEFAULT_PERSONALIZATION = "Color y mensaje";
let seq = 0;
const newKey = () => `k${++seq}`;

/** "21.000" → 21000; vacío → null */
const toInt = (v: string) => {
  const digits = v.replace(/[^\d-]/g, "");
  return digits === "" || digits === "-" ? null : Number(digits);
};

const emptyOption = (): OptionRow => ({ key: newKey(), id: null, name: "Única", price: "", compareAtPrice: "", stock: "", soldOut: false });

/** Reduce la foto en el navegador antes de subirla: menos datos móviles y bajo el límite del servidor. */
async function shrink(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 3_000_000) return file;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.9));
    return blob ? new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" }) : file;
  } catch {
    return file; // formatos que el navegador no decodifica: que decida el servidor
  }
}

export function ProductForm({ product }: { product?: Product & { visible: boolean } }) {
  const [state, formAction, saving] = useActionState<SaveState, FormData>(saveProduct, {});
  const [name, setName] = useState(product?.name ?? "");
  const [category, setCategory] = useState(product?.category ?? "");
  const [subcategory, setSubcategory] = useState(product?.subcategory ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [warning, setWarning] = useState(product?.warning ?? "");
  const [badge, setBadge] = useState(product?.badge ?? "");
  const [personalizable, setPersonalizable] = useState(Boolean(product?.personalization));
  const [personalization, setPersonalization] = useState(product?.personalization ?? DEFAULT_PERSONALIZATION);
  const [visible, setVisible] = useState(product?.visible ?? true);
  const [featured, setFeatured] = useState(product?.featured ?? false);
  const [navidad, setNavidad] = useState(product?.navidad ?? false);
  const [options, setOptions] = useState<OptionRow[]>(
    product?.options.length
      ? product.options.map((o) => ({
          key: newKey(),
          id: o.id,
          name: o.name,
          price: String(o.price),
          compareAtPrice: o.compareAtPrice === null ? "" : String(o.compareAtPrice),
          stock: o.stock === null ? "" : String(o.stock),
          soldOut: o.soldOut,
        }))
      : [emptyOption()],
  );
  const [images, setImages] = useState<ImageRow[]>(
    product?.images.map((i) => ({ key: newKey(), id: i.id, file: i.url.split("/").pop()!, url: i.url, alt: i.alt, width: i.width, height: i.height })) ?? [],
  );
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [dirty, setDirty] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const formId = useId();

  const subcategories = categories.find((c) => c.slug === category)?.subcategories ?? [];
  const uploading = uploads.some((u) => !u.error);

  // Avisar antes de salir con cambios sin guardar
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const touch = () => setDirty(true);

  const payload: ProductInput = {
    id: product?.id ?? null,
    name,
    category,
    subcategory: subcategory || null,
    description,
    warning,
    badge,
    personalization: personalizable ? personalization : "",
    visible,
    featured,
    navidad,
    options: options.map((o) => ({
      id: o.id,
      name: o.name,
      price: toInt(o.price) ?? 0,
      compareAtPrice: toInt(o.compareAtPrice),
      stock: toInt(o.stock),
      soldOut: o.soldOut,
    })),
    images: images.map((i) => ({ id: i.id, file: i.file, alt: i.alt, width: i.width, height: i.height })),
  };

  const setOption = (key: string, patch: Partial<OptionRow>) => {
    setOptions((list) => list.map((o) => (o.key === key ? { ...o, ...patch } : o)));
    touch();
  };
  const moveItem = <T extends { key: string }>(list: T[], key: string, dir: -1 | 1) => {
    const i = list.findIndex((x) => x.key === key);
    const j = i + dir;
    if (j < 0 || j >= list.length) return list;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    return next;
  };

  async function addFiles(files: FileList | null) {
    if (!files?.length) return;
    touch();
    for (const original of Array.from(files)) {
      const key = newKey();
      setUploads((u) => [...u, { key, name: original.name }]);
      const data = new FormData();
      data.set("file", await shrink(original));
      data.set("name", name || "producto");
      const res = await uploadProductImage(data).catch(() => ({ ok: false as const, error: `No se pudo subir "${original.name}". Revisa la conexión.` }));
      if (res.ok) {
        setImages((list) => [...list, { key, id: null, file: res.file, url: res.url, alt: name, width: res.width, height: res.height }]);
        setUploads((u) => u.filter((x) => x.key !== key));
      } else {
        setUploads((u) => u.map((x) => (x.key === key ? { ...x, error: res.error } : x)));
      }
    }
    if (fileInput.current) fileInput.current.value = "";
  }

  return (
    <>
      <form id={formId} action={formAction} onChange={touch} onSubmit={() => setDirty(false)} className="grid gap-6 pb-28 lg:grid-cols-[1fr_22rem] lg:items-start">
        <input type="hidden" name="payload" value={JSON.stringify(payload)} />

        <div className="grid gap-6">
          <Section title="Datos del producto">
            <Field label="Nombre">
              <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={160} className={inputClass} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Categoría">
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setSubcategory("");
                  }}
                  required
                  className={inputClass}
                >
                  <option value="" disabled>
                    Elige una
                  </option>
                  {categories.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Subcategoría">
                <select
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  disabled={subcategories.length === 0}
                  className={`${inputClass} disabled:opacity-50`}
                >
                  <option value="">{subcategories.length ? "Ninguna" : "No tiene"}</option>
                  {subcategories.map((s) => (
                    <option key={s.slug} value={s.slug}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Descripción" hint="Medidas, materiales, notas olfativas, usos… Un salto de línea separa párrafos.">
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={6} maxLength={5000} className={inputClass} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Advertencia (opcional)" hint='Se ve destacada: "No compatible con parafina".'>
                <input value={warning} onChange={(e) => setWarning(e.target.value)} maxLength={160} className={inputClass} />
              </Field>
              <Field label="Etiqueta (opcional)" hint='Sobre la foto: "Premium", "Nuevo".'>
                <input value={badge} onChange={(e) => setBadge(e.target.value)} maxLength={40} className={inputClass} />
              </Field>
            </div>
          </Section>

          <Section
            title="Presentaciones y precios"
            description="Cada tamaño o formato con su precio (30 ml, 60 ml, Docena…). Si solo hay una, déjala como “Única”."
          >
            <ol className="grid gap-3">
              {options.map((o, i) => (
                <li key={o.key} className="rounded-2xl border-2 border-carbon/20 bg-white/60 p-3">
                  <div className="grid gap-3 sm:grid-cols-[1.4fr_1fr_1fr]">
                    <Field label="Nombre">
                      <input value={o.name} onChange={(e) => setOption(o.key, { name: e.target.value })} required maxLength={80} className={inputClass} />
                    </Field>
                    <Field label="Precio">
                      <input
                        value={o.price}
                        onChange={(e) => setOption(o.key, { price: e.target.value })}
                        inputMode="numeric"
                        required
                        placeholder="15000"
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Precio anterior" hint="Opcional, se ve tachado.">
                      <input
                        value={o.compareAtPrice}
                        onChange={(e) => setOption(o.key, { compareAtPrice: e.target.value })}
                        inputMode="numeric"
                        className={inputClass}
                      />
                    </Field>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                    <Field label="Unidades disponibles" hint="Vacío = sin conteo. Si escribes un número, baja solo con cada venta.">
                      <input value={o.stock} onChange={(e) => setOption(o.key, { stock: e.target.value })} inputMode="numeric" className={inputClass} />
                    </Field>
                    <Toggle checked={o.soldOut} onChange={(v) => setOption(o.key, { soldOut: v })} label="Agotado" />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
                    <SmallButton onClick={() => (setOptions((l) => moveItem(l, o.key, -1)), touch())} disabled={i === 0}>
                      ↑ Subir
                    </SmallButton>
                    <SmallButton onClick={() => (setOptions((l) => moveItem(l, o.key, 1)), touch())} disabled={i === options.length - 1}>
                      ↓ Bajar
                    </SmallButton>
                    <SmallButton onClick={() => (setOptions((l) => l.filter((x) => x.key !== o.key)), touch())} disabled={options.length === 1}>
                      Quitar
                    </SmallButton>
                  </div>
                </li>
              ))}
            </ol>
            <button
              type="button"
              onClick={() => {
                setOptions((l) => [...l, { ...emptyOption(), name: "" }]);
                touch();
              }}
              className="toon toon-press justify-self-start rounded-full bg-crema-claro px-4 py-2 text-sm font-bold"
            >
              + Agregar presentación
            </button>
          </Section>
        </div>

        <div className="grid gap-6">
          <Section title="Fotos" description="La primera es la principal. Describe cada foto: ayuda a Google y a personas con lector de pantalla.">
            {images.length > 0 && (
              <ol className="grid gap-3">
                {images.map((img, i) => (
                  <li key={img.key} className="flex gap-3 rounded-2xl border-2 border-carbon/20 bg-white/60 p-2">
                    <div className="relative size-20 shrink-0 overflow-hidden rounded-xl border-2 border-carbon/20">
                      <Image src={img.url} alt="" fill sizes="80px" className="object-cover" />
                      {i === 0 && <span className="absolute inset-x-0 bottom-0 bg-carbon/80 text-center text-[0.6rem] font-bold text-crema">Principal</span>}
                    </div>
                    <div className="grid min-w-0 flex-1 gap-2">
                      <input
                        value={img.alt}
                        onChange={(e) => {
                          const alt = e.target.value;
                          setImages((l) => l.map((x) => (x.key === img.key ? { ...x, alt } : x)));
                        }}
                        aria-label={`Descripción de la foto ${i + 1}`}
                        placeholder="Qué se ve en la foto"
                        maxLength={200}
                        className={`${inputClass} py-1.5 text-sm`}
                      />
                      <div className="flex flex-wrap gap-2 text-xs font-bold">
                        <SmallButton onClick={() => (setImages((l) => moveItem(l, img.key, -1)), touch())} disabled={i === 0}>
                          ↑
                        </SmallButton>
                        <SmallButton onClick={() => (setImages((l) => moveItem(l, img.key, 1)), touch())} disabled={i === images.length - 1}>
                          ↓
                        </SmallButton>
                        <SmallButton onClick={() => (setImages((l) => l.filter((x) => x.key !== img.key)), touch())}>Quitar</SmallButton>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
            {uploads.map((u) => (
              <p key={u.key} role={u.error ? "alert" : "status"} className={`rounded-xl px-3 py-2 text-sm ${u.error ? "bg-miel/60 font-semibold" : "bg-lavanda/50"}`}>
                {u.error ?? `Subiendo ${u.name}…`}
                {u.error && (
                  <button type="button" onClick={() => setUploads((l) => l.filter((x) => x.key !== u.key))} className="ml-2 cursor-pointer underline">
                    Cerrar
                  </button>
                )}
              </p>
            ))}
            <label className="toon toon-press cursor-pointer justify-self-start rounded-full bg-crema-claro px-4 py-2 text-sm font-bold">
              + Agregar fotos
              <input
                ref={fileInput}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="sr-only"
                onChange={(e) => addFiles(e.target.files)}
              />
            </label>
          </Section>

          <Section title="Dónde se muestra">
            <Toggle checked={visible} onChange={(v) => (setVisible(v), touch())} label="Visible en la tienda" hint="Apágalo para ocultarlo sin borrarlo." />
            <Toggle checked={featured} onChange={(v) => (setFeatured(v), touch())} label="Destacado en el inicio" />
            <Toggle checked={navidad} onChange={(v) => (setNavidad(v), touch())} label="Colección Navidad" />
            <Toggle
              checked={personalizable}
              onChange={(v) => (setPersonalizable(v), touch())}
              label="Se puede personalizar"
              hint="El cliente escribe lo que quiere al comprar."
            />
            {personalizable && (
              <Field label="Qué se le pregunta al cliente">
                <input value={personalization} onChange={(e) => setPersonalization(e.target.value)} maxLength={80} className={inputClass} />
              </Field>
            )}
          </Section>

          {product && (
            <Section title="Eliminar">
              {confirmDelete ? (
                <div className="grid gap-2 text-sm">
                  <p>Se borra el producto con sus fotos. Si solo quieres que no se vea, apaga “Visible en la tienda”.</p>
                  <div className="flex gap-2">
                    {/* Dentro del formulario principal (no se anidan formularios): envía solo a deleteProduct */}
                    <input type="hidden" name="id" value={product.id} />
                    <button
                      type="submit"
                      formAction={deleteProduct}
                      formNoValidate
                      className="cursor-pointer rounded-full bg-carbon px-4 py-2 font-bold text-crema"
                    >
                      Sí, eliminar
                    </button>
                    <SmallButton onClick={() => setConfirmDelete(false)}>Cancelar</SmallButton>
                  </div>
                </div>
              ) : (
                <SmallButton onClick={() => setConfirmDelete(true)}>Eliminar producto…</SmallButton>
              )}
            </Section>
          )}
        </div>
      </form>

      {/* Barra fija para guardar: siempre a mano en el celular */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t-3 border-carbon bg-crema-claro px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3">
          <p role="status" aria-live="polite" className="min-w-0 flex-1 text-sm font-semibold">
            {state.error ? (
              <span className="rounded-lg bg-miel/70 px-2 py-1">{state.error}</span>
            ) : uploading ? (
              "Esperando a que terminen de subir las fotos…"
            ) : dirty ? (
              "Hay cambios sin guardar"
            ) : null}
          </p>
          {product && (
            <a href={`/producto/${product.slug}`} target="_blank" className="text-sm font-semibold underline-offset-4 hover:underline">
              Ver en la tienda
            </a>
          )}
          <button
            type="submit"
            form={formId}
            disabled={saving || uploading}
            className="toon toon-press cursor-pointer rounded-full bg-estrella px-6 py-2.5 text-sm font-bold disabled:cursor-wait disabled:opacity-60"
          >
            {saving ? "Guardando…" : product ? "Guardar cambios" : "Crear producto"}
          </button>
        </div>
      </div>
    </>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="toon grid gap-4 rounded-[1.5rem] bg-crema-claro p-4 sm:p-5">
      <div>
        <h2 className="font-display text-lg font-extrabold">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-carbon-suave">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span
        aria-hidden="true"
        className="relative mt-0.5 h-6 w-11 shrink-0 rounded-full border-2 border-carbon bg-white transition-colors peer-checked:bg-oliva peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-carbon after:absolute after:top-0.5 after:left-0.5 after:size-4 after:rounded-full after:bg-carbon after:transition-transform peer-checked:after:translate-x-5"
      />
      <span className="grid">
        <span className="text-sm font-bold">{label}</span>
        {hint && <span className="text-xs text-carbon-suave">{hint}</span>}
      </span>
    </label>
  );
}

function SmallButton({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="cursor-pointer rounded-full border-2 border-carbon/70 bg-crema-claro px-3 py-1 text-xs font-bold hover:bg-lavanda disabled:cursor-not-allowed disabled:opacity-35"
    >
      {children}
    </button>
  );
}
