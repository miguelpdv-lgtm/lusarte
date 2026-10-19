import path from "node:path";
import { sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/mysql2/migrator";
import { createDb } from "./client";

/**
 * Aplica las migraciones pendientes de /drizzle (solo las que faltan, registradas en __drizzle_migrations).
 * Nunca borra datos: cada migración es un cambio de esquema versionado en el repo.
 * Un candado de MySQL evita que la vista previa y producción (que comparten la base) migren a la vez.
 */
export async function runMigrations({ log = console.log } = {}) {
  const { db, pool } = createDb();
  try {
    const [rows] = (await db.execute(sql`SELECT GET_LOCK('lusarte_migraciones', 60) AS ok`)) as unknown as [{ ok: number }[]];
    if (rows[0]?.ok !== 1) throw new Error("No se obtuvo el candado de migraciones (otra instancia está migrando)");
    try {
      await migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
      log("Migraciones de la base al día");
    } finally {
      await db.execute(sql`SELECT RELEASE_LOCK('lusarte_migraciones')`);
    }
  } finally {
    await pool.end();
  }
}
