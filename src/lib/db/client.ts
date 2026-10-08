import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

/** Crea la conexión. Lo usan la app (index.ts) y los scripts de consola. */
export function createDb(url = process.env.DATABASE_URL) {
  if (!url) throw new Error("Falta DATABASE_URL (ver .env.example)");
  const pool = mysql.createPool({ uri: url, connectionLimit: 5, timezone: "Z" });
  return { pool, db: drizzle(pool, { schema, mode: "default", casing: "snake_case" }) };
}
