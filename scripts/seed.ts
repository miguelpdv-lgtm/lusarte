// Carga los productos de data/catalogo/*.json en la base.
// Uso:  npm run db:seed            → agrega los que no existen (no toca lo editado en el panel)
//       npm run db:seed -- --reset → borra TODOS los productos y fotos y carga de cero
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import { categories } from "../src/data/catalog";
import { createDb } from "../src/lib/db/client";
import { productImages, productOptions, products } from "../src/lib/db/schema";
import { slugify } from "../src/lib/slug";
import { deleteImage, saveImage } from "../src/lib/storage";

type SeedProduct = {
  slug?: string;
  name: string;
  category: string;
  subcategory?: string;
  description?: string;
  warning?: string;
  badge?: string;
  personalization?: string;
  visible?: boolean;
  featured?: boolean;
  navidad?: boolean;
  options: { name: string; price: number; compareAtPrice?: number; stock?: number; soldOut?: boolean }[];
  /** Rutas relativas a la raíz del repo */
  images?: { src: string; alt: string }[];
};

const MIME: Record<string, string> = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp" };

async function main() {
  const reset = process.argv.includes("--reset");
  const dir = path.resolve("data/catalogo");
  const files = (await readdir(dir)).filter((f) => f.endsWith(".json")).sort();
  const { db, pool } = createDb();

  if (reset) {
    const old = await db.select({ file: productImages.file }).from(productImages);
    await db.delete(products);
    await Promise.all(old.map((i) => deleteImage(i.file)));
    console.log(`Catálogo borrado (${old.length} fotos eliminadas)`);
  }

  let created = 0;
  let skipped = 0;
  const problems: string[] = [];

  for (const file of files) {
    const list = JSON.parse(await readFile(path.join(dir, file), "utf8")) as SeedProduct[];
    for (const [position, p] of list.entries()) {
      const slug = p.slug ?? slugify(p.name);
      const category = categories.find((c) => c.slug === p.category);
      if (!category) {
        problems.push(`${file}: "${p.name}" tiene una categoría desconocida (${p.category})`);
        continue;
      }
      if (p.subcategory && !category.subcategories.some((s) => s.slug === p.subcategory)) {
        problems.push(`${file}: "${p.name}" tiene una subcategoría desconocida (${p.subcategory})`);
        continue;
      }
      if (!p.options.length) {
        problems.push(`${file}: "${p.name}" no tiene presentaciones`);
        continue;
      }
      const [exists] = await db.select({ id: products.id }).from(products).where(eq(products.slug, slug));
      if (exists) {
        skipped++;
        continue;
      }

      const [{ id }] = await db
        .insert(products)
        .values({
          slug,
          name: p.name,
          category: p.category,
          subcategory: p.subcategory ?? null,
          description: p.description ?? "",
          warning: p.warning ?? null,
          badge: p.badge ?? null,
          personalization: p.personalization ?? null,
          visible: p.visible ?? true,
          featured: p.featured ?? false,
          navidad: p.navidad ?? false,
          position,
        })
        .$returningId();

      await db.insert(productOptions).values(
        p.options.map((o, i) => ({
          productId: id,
          name: o.name,
          price: o.price,
          compareAtPrice: o.compareAtPrice ?? null,
          stock: o.stock ?? null,
          soldOut: o.soldOut ?? false,
          position: i,
        })),
      );

      for (const [i, img] of (p.images ?? []).entries()) {
        const buffer = await readFile(path.resolve(img.src));
        const saved = await saveImage(new File([buffer], path.basename(img.src), { type: MIME[path.extname(img.src).toLowerCase()] }), slug);
        await db.insert(productImages).values({ productId: id, ...saved, alt: img.alt, position: i });
      }
      created++;
    }
  }

  console.log(`Productos creados: ${created} · ya existían: ${skipped}`);
  if (problems.length) console.log(`\nRevisar:\n- ${problems.join("\n- ")}`);
  await pool.end();
}

main();
