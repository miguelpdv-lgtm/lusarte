import { randomBytes } from "node:crypto";
import { mkdir, readdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { eq, inArray } from "drizzle-orm";
import sharp from "sharp";
import { db, schema } from "@/lib/db";
import { slugify } from "@/lib/slug";

// Solo servidor (usa el disco). Lo usan el panel, la ruta /media y los scripts de carga.
// Fotos de productos subidas desde el panel. Se guardan en UPLOADS_DIR (por defecto public/assets/uploads) y,
// como copia segura, en la base (tabla media_files): en GoDaddy la vista previa y el sitio publicado pueden tener
// discos distintos y un despliegue puede vaciar la carpeta, pero la base es la misma. Se sirven por
// /media/<archivo> (src/app/media/[file]/route.ts): primero el disco y, si no está, la base.

const MAX_BYTES = 15 * 1024 * 1024;
const MAX_SIDE = 1600;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
/** Solo nombres generados por saveImage: evita leer fuera de la carpeta */
export const FILE_PATTERN = /^[a-z0-9-]+\.webp$/;

// La carpeta viene de una variable de entorno: que el empaquetador no intente rastrear su contenido
const uploadsDir = () => path.resolve(/*turbopackIgnore: true*/ process.cwd(), process.env.UPLOADS_DIR || "public/assets/uploads");

/** Carpeta de fotos relativa a la app, y si GoDaddy la conserva al publicar un zip (solo public/assets y private). */
export function uploadsLocation() {
  const rel = path.relative(process.cwd(), uploadsDir()).split(path.sep).join("/");
  return { rel, persistent: /^(public\/assets|private)(\/|$)/.test(rel) };
}

const diskFiles = () => readdir(uploadsDir()).then((l) => l.filter((f) => FILE_PATTERN.test(f)), () => [] as string[]);

/** Fotos que se pueden servir: las del disco de este servidor más las copiadas en la base. */
export async function availableImages() {
  const [disk, stored] = await Promise.all([
    diskFiles(),
    db
      .select({ file: schema.mediaFiles.file })
      .from(schema.mediaFiles)
      .then((r) => r.map((x) => x.file))
      .catch(() => [] as string[]),
  ]);
  return new Set([...disk, ...stored]);
}

/** Archivos (de los registrados en la base) que no están ni en el disco ni en la copia de la base. */
export async function missingImages(files: string[]) {
  const available = await availableImages();
  return files.filter((f) => !available.has(f));
}

/**
 * Copia a la base las fotos que solo están en el disco de este servidor (al arrancar). Así una foto subida
 * en la vista previa, o antes de existir la copia en la base, queda disponible también en el sitio publicado.
 */
export async function backfillImages() {
  const disk = await diskFiles();
  if (!disk.length) return 0;
  const stored = new Set(
    (await db.select({ file: schema.mediaFiles.file }).from(schema.mediaFiles).where(inArray(schema.mediaFiles.file, disk))).map((r) => r.file),
  );
  let copied = 0;
  for (const file of disk.filter((f) => !stored.has(f))) {
    const data = await readFile(path.join(uploadsDir(), file)).catch(() => null);
    if (!data) continue;
    await db.insert(schema.mediaFiles).values({ file, data }).onDuplicateKeyUpdate({ set: { file } });
    copied++;
  }
  return copied;
}

export const mediaUrl = (file: string) => `/media/${file}`;

export class ImageError extends Error {}

/** Valida, corrige la orientación, reduce a 1600 px (o maxSide) y guarda en WebP. */
export async function saveImage(file: File, baseName: string, maxSide = MAX_SIDE) {
  if (!ACCEPTED.includes(file.type)) throw new ImageError(`"${file.name}" no es JPG, PNG ni WebP.`);
  if (file.size > MAX_BYTES) throw new ImageError(`"${file.name}" pesa más de 15 MB.`);

  const { data, info } = await sharp(Buffer.from(await file.arrayBuffer()))
    .rotate()
    .resize({ width: maxSide, height: maxSide, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer({ resolveWithObject: true });

  const slug = slugify(baseName, 60);
  const name = `${slug || "foto"}-${randomBytes(4).toString("hex")}.webp`;

  // Primero la base (la copia que sobrevive a despliegues); el disco es una caché local
  await db.insert(schema.mediaFiles).values({ file: name, data });
  await mkdir(uploadsDir(), { recursive: true });
  await writeFile(path.join(uploadsDir(), name), data).catch((e) => console.error(`No se pudo guardar ${name} en el disco:`, e));
  return { file: name, width: info.width, height: info.height };
}

export async function readImage(file: string) {
  if (!FILE_PATTERN.test(file)) return null;
  const local = await readFile(path.join(uploadsDir(), file)).catch(() => null);
  if (local) return local;
  try {
    const [row] = await db.select({ data: schema.mediaFiles.data }).from(schema.mediaFiles).where(eq(schema.mediaFiles.file, file)).limit(1);
    if (!row) return null;
    // Se deja en el disco de este servidor para la próxima vez (si falla, se sigue sirviendo desde la base)
    await mkdir(uploadsDir(), { recursive: true })
      .then(() => writeFile(path.join(uploadsDir(), file), row.data))
      .catch(() => {});
    return row.data;
  } catch {
    return null;
  }
}

export async function deleteImage(file: string) {
  if (!FILE_PATTERN.test(file)) return;
  await unlink(path.join(uploadsDir(), file)).catch(() => {});
  await db
    .delete(schema.mediaFiles)
    .where(eq(schema.mediaFiles.file, file))
    .catch((e) => console.error(`No se pudo borrar ${file} de la base:`, e));
}
