import type { Metadata } from "next";
import Link from "next/link";
import { NewProductForm } from "@/components/admin/NewProductForm";
import { requireAdmin } from "@/lib/auth/session";
import { effiCategoryOptions } from "@/lib/catalog/effi-categories";

export const metadata: Metadata = { title: "Nuevo producto" };

export default async function NuevoProducto() {
  await requireAdmin();
  return (
    <div className="grid grid-cols-1 gap-6">
      <div>
        <Link href="/admin/productos" className="text-sm font-semibold underline-offset-4 hover:underline">
          ← Productos
        </Link>
        <h1 className="mt-2 font-display text-3xl font-extrabold">Nuevo producto</h1>
        <p className="mt-1 text-carbon-suave">Se crea en Effi y en la tienda al mismo tiempo. También puedes crearlo en Effi: aparece aquí solo al sincronizar.</p>
      </div>
      <NewProductForm effiCategories={await effiCategoryOptions()} />
    </div>
  );
}
