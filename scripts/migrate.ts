// Aplica las migraciones de /drizzle. Uso: npm run db:migrate (el servidor también lo hace solo al arrancar).
import { runMigrations } from "../src/lib/db/migrate";

runMigrations().catch((e) => {
  console.error(e);
  process.exit(1);
});
