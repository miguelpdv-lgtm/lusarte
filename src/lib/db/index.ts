import "server-only";
import { createDb } from "./client";

// Una sola conexión por proceso (en desarrollo el recargado en caliente reimporta este módulo).
const globalForDb = globalThis as unknown as { lusarteDb?: ReturnType<typeof createDb> };

const conn = globalForDb.lusarteDb ?? createDb();
if (process.env.NODE_ENV !== "production") globalForDb.lusarteDb = conn;

export const db = conn.db;
export * as schema from "./schema";
