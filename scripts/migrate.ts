// Aplica las migraciones de /drizzle. Uso: npm run db:migrate
import { migrate } from "drizzle-orm/mysql2/migrator";
import { createDb } from "../src/lib/db/client";

async function main() {
  const { db, pool } = createDb();
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("Migraciones aplicadas");
  await pool.end();
}

main();
