// Corre una vez al arrancar el servidor (antes de atender peticiones): aplica las migraciones pendientes,
// así un cambio de esquema llega a producción con el zip, sin importar .sql a mano.
// Si la base no responde, se registra el error y la app arranca igual (la revisión de estado prueba "/").
// AUTO_MIGRATE=0 lo desactiva.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  if (process.env.AUTO_MIGRATE === "0") return;
  if (!process.env.DATABASE_URL && !process.env.DB_HOST) return;
  try {
    const { runMigrations } = await import("./lib/db/migrate");
    await runMigrations();
  } catch (e) {
    console.error("No se pudieron aplicar las migraciones al arrancar:", e);
  }
}
