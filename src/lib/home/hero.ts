import "server-only";
import { eq } from "drizzle-orm";
import { cache } from "react";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { availableImages, mediaUrl } from "@/lib/storage";

// Fotos del hero del inicio, editables desde Panel → Portada y guardadas en settings["hero"].
// Sin foto propia se usa la panorámica incluida en el sitio (public/hero).

const KEY = "hero";

const photoSchema = z.object({ file: z.string(), width: z.number().int().positive(), height: z.number().int().positive() });
const heroSchema = z.object({ desktop: photoSchema.nullable(), mobile: photoSchema.nullable() });

export type HeroSlot = "desktop" | "mobile";
export type HeroSettings = z.infer<typeof heroSchema>;
export type HeroPhoto = { src: string; width: number; height: number; custom: boolean };

/** Panorámica 21:9 con los productos a la derecha y la pared libre a la izquierda. */
export const DEFAULT_HERO: HeroPhoto = { src: "/hero/hero-panoramica.webp", width: 2400, height: 1018, custom: false };

export const getHeroSettings = cache(async (): Promise<HeroSettings> => {
  try {
    const [row] = await db.select().from(schema.settings).where(eq(schema.settings.key, KEY)).limit(1);
    if (row) {
      const parsed = heroSchema.safeParse(JSON.parse(row.value));
      if (parsed.success) return parsed.data;
    }
  } catch {
    // Sin base o JSON dañado: la foto incluida
  }
  return { desktop: null, mobile: null };
});

export async function saveHeroSettings(value: HeroSettings) {
  const json = JSON.stringify(heroSchema.parse(value));
  await db.insert(schema.settings).values({ key: KEY, value: json }).onDuplicateKeyUpdate({ set: { value: json } });
}

const toPhoto = (p: z.infer<typeof photoSchema>): HeroPhoto => ({ src: mediaUrl(p.file), width: p.width, height: p.height, custom: true });

/** Fotos que muestra el hero. En celular: la foto de celular, o si no hay, la de computador recortada. */
export async function getHeroPhotos() {
  const s = await getHeroSettings();
  // Si el archivo de una foto propia no está, la incluida (mejor que una foto rota)
  const available = s.desktop || s.mobile ? await availableImages() : new Set<string>();
  const desktop = s.desktop && available.has(s.desktop.file) ? toPhoto(s.desktop) : DEFAULT_HERO;
  return { desktop, mobile: s.mobile && available.has(s.mobile.file) ? toPhoto(s.mobile) : null };
}
