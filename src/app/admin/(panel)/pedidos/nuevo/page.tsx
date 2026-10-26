import type { Metadata } from "next";
import Link from "next/link";
import { ManualOrderForm } from "@/components/admin/ManualOrderForm";
import { requireAdmin } from "@/lib/auth/session";
import { loadProducts, toPublicCatalog } from "@/lib/catalog/queries";
import { availableUnits } from "@/lib/catalog/types";
import { LEGAL_ID_TYPES } from "@/lib/shop/orders";
import { departmentOptions } from "@/lib/shop/places";

export const metadata: Metadata = { title: "Registrar pedido" };
export const dynamic = "force-dynamic";

export default async function NuevoPedido() {
  await requireAdmin();
  const catalog = toPublicCatalog(await loadProducts());
  const products = catalog
    .flatMap((p) =>
      p.options.map((o) => {
        const units = availableUnits(o);
        return {
          optionId: o.id,
          name: p.options.length > 1 ? `${p.name} · ${o.name}` : p.name,
          price: o.price,
          units: units === Infinity ? null : units,
        };
      }),
    )
    .filter((o) => o.units !== 0)
    .sort((a, b) => a.name.localeCompare(b.name, "es"));

  return (
    <div className="grid grid-cols-1 gap-6">
      <div>
        <Link href="/admin/pedidos" className="text-sm font-semibold underline-offset-4 hover:underline">
          ← Pedidos
        </Link>
        <h1 className="mt-2 font-display text-3xl font-extrabold">Registrar pedido</h1>
        <p className="mt-1 text-carbon-suave">
          Para ventas por WhatsApp o en persona. Queda igual que un pedido de la web: aparta el inventario, crea la remisión en Effi y le envía al cliente el
          correo de confirmación con el comprobante.
        </p>
      </div>
      <ManualOrderForm products={products} departments={departmentOptions()} idTypes={LEGAL_ID_TYPES} />
    </div>
  );
}
