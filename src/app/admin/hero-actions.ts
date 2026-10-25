"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { getHeroSettings, saveHeroSettings, type HeroSlot } from "@/lib/home/hero";
import { deleteImage, ImageError, saveImage } from "@/lib/storage";

export type HeroState = { ok?: string; error?: string };

const slotOf = (v: FormDataEntryValue | null): HeroSlot | null => (v === "desktop" || v === "mobile" ? v : null);
const LABEL: Record<HeroSlot, string> = { desktop: "computador", mobile: "celular" };

/** Sube la foto del hero de un tamaño de pantalla y reemplaza la anterior. */
export async function saveHeroPhoto(_prev: HeroState, form: FormData): Promise<HeroState> {
  await requireAdmin();
  const slot = slotOf(form.get("slot"));
  const file = form.get("file");
  if (!slot) return { error: "No se pudo leer el formulario. Recarga la página." };
  if (!(file instanceof File) || file.size === 0) return { error: "Elige una foto primero." };

  let saved;
  try {
    // La de computador va a todo el ancho de la pantalla: más resolución que las de producto
    saved = await saveImage(file, `portada-${slot}`, slot === "desktop" ? 2400 : 1600);
  } catch (e) {
    return { error: e instanceof ImageError ? e.message : `No se pudo procesar "${file.name}".` };
  }

  const current = await getHeroSettings();
  await saveHeroSettings({ ...current, [slot]: saved });
  if (current[slot]) await deleteImage(current[slot].file);
  revalidatePath("/");
  revalidatePath("/admin/portada");
  return { ok: `Listo: la portada de ${LABEL[slot]} ya tiene la foto nueva.` };
}

/** Quita la foto propia: vuelve a la incluida (computador) o al recorte de la de computador (celular). */
export async function resetHeroPhoto(_prev: HeroState, form: FormData): Promise<HeroState> {
  await requireAdmin();
  const slot = slotOf(form.get("slot"));
  if (!slot) return { error: "No se pudo leer el formulario. Recarga la página." };
  const current = await getHeroSettings();
  if (!current[slot]) return {};
  await saveHeroSettings({ ...current, [slot]: null });
  await deleteImage(current[slot].file);
  revalidatePath("/");
  revalidatePath("/admin/portada");
  return { ok: slot === "desktop" ? "Listo: volvimos a la foto original." : "Listo: en celular se usará la foto de computador, recortada." };
}
