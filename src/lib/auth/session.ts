import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db, schema } from "@/lib/db";

// Sesión del panel: cookie firmada (HMAC) con el id del usuario, la versión de sesión y el vencimiento.
// Sin tabla de sesiones: cambiar la contraseña sube `sessionVersion` y anula las cookies viejas.

const COOKIE = "lusarte_admin";
const MAX_AGE = 60 * 60 * 24 * 14; // 14 días

type Payload = { uid: number; v: number; exp: number };

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) throw new Error("AUTH_SECRET falta o es muy corto (ver .env.example)");
  return s;
}

const sign = (data: string) => createHmac("sha256", secret()).update(data).digest("base64url");

function encode(payload: Payload) {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${data}.${sign(data)}`;
}

function decode(token: string): Payload | null {
  const [data, mac] = token.split(".");
  if (!data || !mac) return null;
  const expected = Buffer.from(sign(data));
  const actual = Buffer.from(mac);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString()) as Payload;
    return payload.exp > Date.now() / 1000 ? payload : null;
  } catch {
    return null;
  }
}

export async function startSession(user: { id: number; sessionVersion: number }) {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE;
  (await cookies()).set(COOKIE, encode({ uid: user.id, v: user.sessionVersion, exp }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
}

/** Usuario del panel de esta petición, o null. */
export const getAdmin = cache(async () => {
  const token = (await cookies()).get(COOKIE)?.value;
  const payload = token ? decode(token) : null;
  if (!payload) return null;
  const [user] = await db
    .select({ id: schema.adminUsers.id, email: schema.adminUsers.email, v: schema.adminUsers.sessionVersion })
    .from(schema.adminUsers)
    .where(eq(schema.adminUsers.id, payload.uid));
  return user && user.v === payload.v ? { id: user.id, email: user.email } : null;
});

/** Para páginas y acciones del panel: sin sesión, al login. */
export async function requireAdmin() {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/ingresar");
  return admin;
}
