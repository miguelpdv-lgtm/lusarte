// Crea el usuario del panel o le cambia la contraseña (y cierra sus sesiones abiertas).
// Uso: npm run admin:create -- correo@ejemplo.com "contraseña larga"
import { eq, sql } from "drizzle-orm";
import { hashPassword } from "../src/lib/auth/password";
import { createDb } from "../src/lib/db/client";
import { adminUsers } from "../src/lib/db/schema";

async function main() {
  const [email, password] = process.argv.slice(2);
  if (!email?.includes("@") || !password || password.length < 10) {
    console.error('Uso: npm run admin:create -- correo@ejemplo.com "contraseña de 10+ caracteres"');
    process.exit(1);
  }
  const { db, pool } = createDb();
  const passwordHash = await hashPassword(password);
  const normalized = email.trim().toLowerCase();
  const [existing] = await db.select().from(adminUsers).where(eq(adminUsers.email, normalized));
  if (existing) {
    await db
      .update(adminUsers)
      .set({ passwordHash, sessionVersion: sql`${adminUsers.sessionVersion} + 1` })
      .where(eq(adminUsers.id, existing.id));
    console.log(`Contraseña actualizada para ${normalized}`);
  } else {
    await db.insert(adminUsers).values({ email: normalized, passwordHash });
    console.log(`Usuario creado: ${normalized}`);
  }
  await pool.end();
}

main();
