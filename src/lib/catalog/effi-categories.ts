import "server-only";
import { asc, eq } from "drizzle-orm";
import { categories, effiCategoryMap } from "@/data/catalog";
import { db, schema } from "@/lib/db";

/** Categorías de Effi para los selects del panel, con la categoría de la tienda a la que corresponden. */
export async function effiCategoryOptions() {
  const rows = await db.select().from(schema.effiCategories).where(eq(schema.effiCategories.vigente, true)).orderBy(asc(schema.effiCategories.nombre));
  return rows.map((c) => {
    const mapped = effiCategoryMap[c.id];
    const cat = mapped && categories.find((x) => x.slug === mapped.category);
    const sub = mapped?.subcategory && cat?.subcategories.find((s) => s.slug === mapped.subcategory);
    return { id: c.id, nombre: c.nombre, tienda: cat ? `${cat.short}${sub ? ` › ${sub.name}` : ""}` : null };
  });
}
