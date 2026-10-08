import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/ProductForm";
import { requireAdmin } from "@/lib/auth/session";
import { loadProducts } from "@/lib/catalog/queries";

export const metadata: Metadata = { title: "Editar producto" };

export default async function EditarProducto({ params, searchParams }: PageProps<"/admin/productos/[id]">) {
  await requireAdmin();
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const product = (await loadProducts({ onlyVisible: false })).find((p) => p.id === Number(id));
  if (!product) notFound();

  return (
    <div className="grid grid-cols-1 gap-6">
      <div>
        <Link href="/admin/productos" className="text-sm font-semibold underline-offset-4 hover:underline">
          ← Productos
        </Link>
        <h1 className="mt-2 font-display text-3xl font-extrabold">{product.name}</h1>
        {sp.guardado && (
          <p role="status" className="toon mt-3 rounded-2xl bg-oliva/40 px-4 py-3 text-sm font-semibold">
            Cambios guardados.
          </p>
        )}
        {sp.nuevo && (
          <p role="status" className="toon mt-3 rounded-2xl bg-oliva/40 px-4 py-3 text-sm font-semibold">
            Producto creado. Ya puedes verlo en la tienda{product.visible ? "" : " (está oculto)"}.
          </p>
        )}
      </div>
      <ProductForm key={JSON.stringify(product)} product={product} />
    </div>
  );
}
