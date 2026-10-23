"use server";

import { eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { endSession, requireAdmin, startSession } from "@/lib/auth/session";
import { CATALOG_TAG } from "@/lib/catalog/queries";
import { db, schema } from "@/lib/db";
import { syncAll } from "@/lib/effi/sync";
import { deleteImage, ImageError, mediaUrl, saveImage } from "@/lib/storage";

// ─── Login ───

// Freno a la fuerza bruta (un solo proceso Node): 5 intentos fallidos por IP y 10 por cuenta cada 15 minutos.
// El de la cuenta no depende de la IP: x-forwarded-for lo puede inventar quien ataca para estrenar IP en cada intento.
const attempts = new Map<string, { count: number; until: number }>();
const WINDOW = 15 * 60 * 1000;
const LIMITS = { ip: 5, email: 10 };

function blocked(key: string, limit: number, now: number) {
  const r = attempts.get(key);
  return !!r && r.until > now && r.count >= limit;
}

function fail(key: string, now: number) {
  const r = attempts.get(key);
  const fresh = !r || r.until <= now;
  attempts.set(key, { count: fresh ? 1 : r.count + 1, until: fresh ? now + WINDOW : r.until });
  // Que el mapa no crezca sin fin con IPs inventadas
  if (attempts.size > 5000) for (const [k, v] of attempts) if (v.until <= now) attempts.delete(k);
}

// Hash de relleno: sin usuario también se calcula scrypt, para que el tiempo de respuesta no delate qué correos existen
const DUMMY_HASH = hashPassword("relleno-sin-usuario");

export type LoginState = { error?: string };

export async function login(_prev: LoginState, form: FormData): Promise<LoginState> {
  const ip = `ip:${(await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "local"}`;
  const email = String(form.get("email") ?? "").trim().toLowerCase().slice(0, 254);
  const password = String(form.get("password") ?? "").slice(0, 200);
  const account = `email:${email}`;
  const now = Date.now();
  if (blocked(ip, LIMITS.ip, now) || blocked(account, LIMITS.email, now)) {
    return { error: "Demasiados intentos. Espera 15 minutos e inténtalo de nuevo." };
  }

  let user: typeof schema.adminUsers.$inferSelect | undefined;
  try {
    [user] = email ? await db.select().from(schema.adminUsers).where(eq(schema.adminUsers.email, email)) : [];
  } catch {
    return { error: "No se pudo consultar la base de datos. Recarga esta página para ver qué falta en el servidor." };
  }
  const ok = await verifyPassword(password, user?.passwordHash ?? (await DUMMY_HASH));

  if (!user || !ok) {
    fail(ip, now);
    fail(account, now);
    return { error: "Correo o contraseña incorrectos." };
  }

  attempts.delete(ip);
  attempts.delete(account);
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
