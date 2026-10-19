import "server-only";
import { createDb } from "./client";

type Conn = ReturnType<typeof createDb>;

// Una sola conexión por proceso (en desarrollo el recargado en caliente reimporta este módulo).
// Se crea en la primera consulta, no al importar: así el build no necesita variables de base de datos.
const globalForDb = globalThis as unknown as { lusarteDb?: Conn };

function conn() {
  globalForDb.lusarteDb ??= createDb();
  return globalForDb.lusarteDb;
}

export const db = new Proxy({} as Conn["db"], {
  get(_, prop) {
    const real = conn().db;
    const value = Reflect.get(real, prop, real);
    return typeof value === "function" ? value.bind(real) : value;
  },
});
export * as schema from "./schema";
