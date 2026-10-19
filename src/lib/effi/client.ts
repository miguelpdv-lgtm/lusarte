// Cliente de la API de Effi ERP (https://effi.com.co/api/). Ver docs/EFFI.md.
// Sin "server-only": lo usan la app y los scripts de consola. Nunca importarlo desde el navegador.

const BASE = "https://effi.com.co/api/";

export class EffiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

function apiKey() {
  const key = process.env.EFFI_API_KEY?.trim();
  if (!key) throw new EffiError("Falta EFFI_API_KEY (ver .env.example)", 0);
  return key;
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

type EffiResponse<T> = { ok: true; data: T; paginacion?: { pagina: number; total_paginas: number; total: number } } | { ok: false; mensaje: string };

/** Una petición a Effi. Reintenta sola si se pasa del límite (429, respeta Retry-After). */
export async function effiRequest<T>(method: "GET" | "POST" | "PUT" | "DELETE", path: string, body?: unknown, params?: Record<string, string | number>) {
  const url = new URL(path, BASE);
  for (const [k, v] of Object.entries(params ?? {})) url.searchParams.set(k, String(v));

  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${apiKey()}`, ...(body ? { "Content-Type": "application/json" } : {}) },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
    });

    if (res.status === 429 && attempt < 4) {
      await wait((Number(res.headers.get("Retry-After")) || 10) * 1000);
      continue;
    }

    const json = (await res.json().catch(() => null)) as EffiResponse<T> | null;
    if (!json) throw new EffiError(`Effi respondió ${res.status} sin JSON`, res.status);
    if (!json.ok) {
      const hint =
        res.status === 401
          ? " (la API key de Effi es inválida o venció: se renueva en Administración → Usuarios → Ver más detalles)"
          : res.status === 403
            ? " (al usuario de Effi le falta el permiso para esta función)"
            : "";
      throw new EffiError(`${json.mensaje}${hint}`, res.status);
    }
    return json;
  }
}

/** GET paginado: trae todas las páginas (100 por página). */
export async function effiGetAll<T>(path: string, params: Record<string, string | number> = {}) {
  const all: T[] = [];
  for (let pagina = 1; ; pagina++) {
    const res = await effiRequest<T[]>("GET", path, undefined, { ...params, pagina, por_pagina: 100 });
    if (!res.ok) return all;
    all.push(...res.data);
    if (!res.paginacion || pagina >= res.paginacion.total_paginas) return all;
  }
}
