"use server";

import { eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { verifyPassword } from "@/lib/auth/password";
import { endSession, requireAdmin, startSession } from "@/lib/auth/session";
import { CATALOG_TAG } from "@/lib/catalog/queries";
import { db, schema } from "@/lib/db";
import { syncAll } from "@/lib/effi/sync";
import { deleteImage, ImageError, mediaUrl, saveImage } from "@/lib/storage";

// ─── Login ───

// Freno a la fuerza bruta: 5 intentos fallidos por IP cada 15 minutos (un solo proceso Node).
const attempts = new Map<string, { count: number; until: number }>();
const WINDOW = 15 * 60 * 1000;

export type LoginState = { error?: string };

export async function login(_prev: LoginState, form: FormData): Promise<LoginState> {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const now = Date.now();
  const record = attempts.get(ip);
  if (record && record.until > now && record.count >= 5) {
    return { error: "Demasiados intentos. Espera 15 minutos e inténtalo de nuevo." };
  }

  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  let user: typeof schema.adminUsers.$inferSelect | undefined;
  try {
    [user] = email ? await db.select().from(schema.adminUsers).where(eq(schema.adminUsers.email, email)) : [];
  } catch {
    return { error: "No se pudo consultar la base de datos. Recarga esta página para ver qué falta en el servidor." };
  }
  const ok = user ? await verifyPassword(password, user.passwordHash) : false;

  if (!user || !ok) {
    const fresh = !record || record.until <= now;
    attempts.set(ip, { count: fresh ? 1 : record.count + 1, until: fresh ? now + WINDOW : record.until });
    return { error: "Correo o contraseña incorrectos." };
  }

  attempts.delete(ip);
  try {
    await startSession(user);
  } catch {
    return { error: "El servidor no tiene AUTH_SECRET configurado (o es muy corto). Agrégalo en los Secrets de GoDaddy y reinicia la app." };
  }
  redirect("/admin");
}

export async function logout() {
  await endSession();
  redirect("/admin/ingresar");
}

// ─── Fotos ───

export type UploadResult = { ok: true; file: string; url: string; width: number; height: number } | { ok: false; error: string };

/** Sube una foto apenas se elige; se asocia al producto al guardar el formulario. */
export async function uploadProductImage(form: FormData): Promise<UploadResult> {
  await requireAdmin();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "No llegó ninguna foto." };
  try {
    const saved = await saveImage(file, String(form.get("name") || "producto"));
    return { ok: true, ...saved, url: mediaUrl(saved.file) };
  } catch (e) {
    return { ok: false, error: e instanceof ImageError ? e.message : `No se pudo procesar "${file.name}".` };
  }
}

// ─── Effi ───

export type SyncActionState = { message?: string; error?: string };

/** Botón "Sincronizar ahora" del panel. */
export async function syncNow(): Promise<SyncActionState> {
  await requireAdmin();
  const res = await syncAll(db);
  await Promise.all((res.articles?.removedFiles ?? []).map(deleteImage));
  updateTag(CATALOG_TAG);
  const errors = [res.articles, res.sales].filter((r) => r && !r.ok).map((r) => r!.error);
  if (errors.length) return { error: errors.join(" · ") };
  return { message: [res.articles?.detalle, res.sales?.detalle].filter(Boolean).join(" · ") };
}
