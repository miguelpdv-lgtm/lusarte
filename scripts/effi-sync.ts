// Sincroniza Effi → base local (artículos y remisiones). Uso: npm run effi:sync
import { createDb } from "../src/lib/db/client";
import { syncAll } from "../src/lib/effi/sync";
import { deleteImage } from "../src/lib/storage";

async function main() {
  const { db, pool } = createDb();
  const t = Date.now();
  const res = await syncAll(db);
  await Promise.all((res.articles?.removedFiles ?? []).map(deleteImage));
  for (const [k, v] of Object.entries(res)) console.log(k, v.ok ? "✓" : "✗", v.detalle ?? v.error);
  console.log(`listo en ${((Date.now() - t) / 1000).toFixed(1)} s`);
  await pool.end();
}

main();
