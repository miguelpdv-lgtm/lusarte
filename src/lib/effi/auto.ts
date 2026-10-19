import "server-only";
import { revalidateTag } from "next/cache";
import { after } from "next/server";
import { CATALOG_TAG } from "@/lib/catalog/queries";
import { db } from "@/lib/db";
import { deleteImage } from "@/lib/storage";
import { getState, syncAll } from "./sync";

/** Cada cuánto se vuelve a leer Effi en segundo plano */
const MAX_AGE = 15 * 60 * 1000;
let running = false;

/**
 * Si los datos de Effi tienen más de 15 minutos, sincroniza después de responder (no hace esperar a nadie).
 * Llamar solo desde páginas dinámicas: en una página estática correría al compilar.
 */
export function syncEffiIfStale() {
  if (running || !process.env.EFFI_API_KEY) return;
  after(async () => {
    if (running) return;
    running = true;
    try {
      const state = await getState(db, "articles");
      if (state && Date.now() - new Date(state.at).getTime() < MAX_AGE) return;
      const res = await syncAll(db);
      await Promise.all((res.articles?.removedFiles ?? []).map(deleteImage));
      try {
        revalidateTag(CATALOG_TAG, { expire: 0 });
      } catch {
        // Si no se puede invalidar aquí, el catálogo se refresca solo (revalidate del caché)
      }
    } catch (e) {
      console.error("Sincronización con Effi falló:", e);
    } finally {
      running = false;
    }
  });
}
