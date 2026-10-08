import type { Metadata } from "next";
import Link from "next/link";
import { ProductForm } from "@/components/admin/ProductForm";
import { requireAdmin } from "@/lib/auth/session";

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
      </div>
      <ProductForm />
    </div>
  );
}
