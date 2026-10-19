import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

/**
 * Datos de conexión: DATABASE_URL (desarrollo local) o las variables DB_* que inyecta
 * el hosting de GoDaddy (DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD).
 */
function connectionOptions(url = process.env.DATABASE_URL): mysql.PoolOptions {
  if (url) return { uri: url };
  const { DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD } = process.env;
  if (!DB_HOST || !DB_NAME || !DB_USER) throw new Error("Faltan DATABASE_URL o DB_HOST/DB_NAME/DB_USER (ver .env.example)");
  return { host: DB_HOST, port: Number(DB_PORT || 3306), database: DB_NAME, user: DB_USER, password: DB_PASSWORD };
}

/** Crea la conexión. Lo usan la app (index.ts) y los scripts de consola. */
export function createDb(url?: string) {
  // Pool pequeño que suelta las conexiones inactivas: el hosting prefiere conexiones de vida corta
  const pool = mysql.createPool({ ...connectionOptions(url), connectionLimit: 5, maxIdle: 1, idleTimeout: 60_000, enableKeepAlive: true, timezone: "Z" });
  // La app lee las fechas como UTC ("Z"): la sesión de MySQL también debe estar en UTC, o los
  // DEFAULT now() quedan en la hora local del servidor y se ven corridos
  pool.on("connection", (conn) => {
    conn.query("SET time_zone = '+00:00'");
  });
  return { pool, db: drizzle(pool, { schema, mode: "default", casing: "snake_case" }) };
}
