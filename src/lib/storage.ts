import { randomBytes } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { slugify } from "@/lib/slug";

// Solo servidor (usa el disco). Lo usan el panel, la ruta /media y los scripts de carga.
// Fotos de productos subidas desde el panel. Se guardan en UPLOADS_DIR (por defecto public/assets/uploads,
// la carpeta que GoDaddy conserva entre publicaciones), una carpeta que
// sobrevive a los redeploys, y se sirven por /media/<archivo> (src/app/media/[file]/route.ts).

const MAX_BYTES = 15 * 1024 * 1024;
const MAX_SIDE = 1600;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
/** Solo nombres generados por saveImage: evita leer fuera de la carpeta */
export const FILE_PATTERN = /^[a-z0-9-]+\.webp$/;

// La carpeta viene de una variable de entorno: que el empaquetador no intente rastrear su contenido
const uploadsDir = () => path.resolve(/*turbopackIgnore: true*/ process.cwd(), process.env.UPLOADS_DIR || "public/assets/uploads");

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

  await mkdir(uploadsDir(), { recursive: true });
  await writeFile(path.join(uploadsDir(), name), data);
  return { file: name, width: info.width, height: info.height };
}

export async function readImage(file: string) {
  if (!FILE_PATTERN.test(file)) return null;
  try {
    return await readFile(path.join(uploadsDir(), file));
  } catch {
    return null;
  }
}

export async function deleteImage(file: string) {
  if (!FILE_PATTERN.test(file)) return;
  await unlink(path.join(uploadsDir(), file)).catch(() => {});
}
