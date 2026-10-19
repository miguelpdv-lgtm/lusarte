import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckoutForm } from "@/components/cart/CheckoutForm";
import { Breadcrumbs } from "@/components/store/Breadcrumbs";
import { checkoutEnabled, shippingCost, wompiConfig } from "@/lib/shop/config";
import { LEGAL_ID_TYPES } from "@/lib/shop/orders";
import { departmentOptions } from "@/lib/shop/places";

export const metadata: Metadata = { title: "Pagar", robots: { index: false } };
export const dynamic = "force-dynamic";

export default function CheckoutPage() {
  // Sin llaves de Wompi se sigue pidiendo por WhatsApp desde el carrito
  if (!checkoutEnabled()) redirect("/carrito");
  return (
    <div className="mx-auto max-w-6xl px-4 pt-6 pb-20 sm:px-6 lg:px-8 lg:pt-10">
      <Breadcrumbs items={[{ label: "Carrito", href: "/carrito" }, { label: "Pagar" }]} />
      <h1 className="mt-3 mb-8 font-hand text-[2.5rem] leading-none sm:text-5xl">Finaliza tu compra</h1>
      {wompiConfig()?.sandbox && (
        <p role="note" className="toon mb-6 rounded-2xl bg-miel/50 px-4 py-3 text-sm font-semibold">
          Modo de pruebas de Wompi: usa las tarjetas de prueba, no se cobra dinero real.
        </p>
      )}
      <CheckoutForm shipping={shippingCost()} departments={departmentOptions()} idTypes={LEGAL_ID_TYPES} />
    </div>
  );
}
