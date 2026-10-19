import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/ProductForm";
import { requireAdmin } from "@/lib/auth/session";
import { effiCategoryOptions } from "@/lib/catalog/effi-categories";
import { loadProducts } from "@/lib/catalog/queries";

export const metadata: Metadata = { title: "Editar producto" };

const NOTICES: Record<string, string> = {
  guardado: "Cambios guardados (en la web y en Effi).",
  nuevo: "Producto creado en Effi y en la tienda. Agrégale fotos.",
  agregada: "Presentación creada en Effi.",
  anulada: "Presentación anulada en Effi.",
  movido: "Presentación movida.",
};

export default async function EditarProducto({ params, searchParams }: PageProps<"/admin/productos/[id]">) {
  await requireAdmin();
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const [all, effiCategories] = await Promise.all([loadProducts(), effiCategoryOptions()]);
  const product = all.find((p) => p.id === Number(id));
  if (!product) notFound();

  const moveTargets = all
    .filter((p) => p.id !== product.id && p.category === product.category)
    .map((p) => ({ id: p.id, name: p.name }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const notice = Object.keys(NOTICES).find((k) => sp[k]);
  const error = typeof sp.error === "string" ? sp.error : null;

  return (
    <div className="grid grid-cols-1 gap-6">
      <div>
        <Link href="/admin/productos" className="text-sm font-semibold underline-offset-4 hover:underline">
          ← Productos
        </Link>
        <h1 className="mt-2 font-display text-3xl font-extrabold">{product.name}</h1>
        {notice && (
          <p role="status" className="toon mt-3 rounded-2xl bg-oliva/40 px-4 py-3 text-sm font-semibold">
            {NOTICES[notice]}
          </p>
        )}
        {error && (
          <p role="alert" className="toon mt-3 rounded-2xl bg-miel/60 px-4 py-3 text-sm font-semibold">
            {error}
          </p>
        )}
      </div>
      {/* key: tras guardar, crear o mover se recargan los datos del servidor */}
      <ProductForm key={JSON.stringify(product)} product={product} effiCategories={effiCategories} moveTargets={moveTargets} />
    </div>
  );
}
