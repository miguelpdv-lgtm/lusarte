import type { Metadata } from "next";
import { CartView } from "@/components/cart/CartView";
import { Breadcrumbs } from "@/components/store/Breadcrumbs";
import { checkoutEnabled } from "@/lib/shop/config";
import { shippingRange } from "@/lib/shop/shipping";

export const metadata: Metadata = { title: "Carrito", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function CarritoPage() {
  const range = await shippingRange();
  return (
    <div className="mx-auto max-w-6xl px-4 pt-6 pb-20 sm:px-6 lg:px-8 lg:pt-10">
      <Breadcrumbs items={[{ label: "Tienda", href: "/tienda" }, { label: "Carrito" }]} />
      <h1 className="mt-3 mb-8 font-hand text-[2.5rem] leading-none sm:text-5xl">Tu carrito</h1>
      <CartView localNames={range.localNames} checkoutEnabled={checkoutEnabled()} />
    </div>
  );
}
