"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { CloseIcon } from "@/components/ui/icons";
import { cartCount, cartSubtotal, drawer, useCart, useDrawer } from "@/lib/cart/store";
import { lineKey } from "@/lib/cart/types";
import { formatCOP } from "@/lib/format";
import { CartLineItem } from "./CartLineItem";

/** Carrito lateral que se abre al agregar un producto. */
export function MiniCart({ checkoutEnabled }: { checkoutEnabled: boolean }) {
  const open = useDrawer();
  const lines = useCart();
  const path = usePathname();

  // Al cambiar de página se cierra
  useEffect(() => drawer.close(), [path]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && drawer.close();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const count = cartCount(lines);

  return (
    <>
      <div
        className={`fixed inset-0 z-50 bg-carbon/40 transition-opacity ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={drawer.close}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Tu carrito"
        inert={!open}
        className={`fixed inset-y-0 right-0 z-50 flex w-[min(24rem,92vw)] flex-col bg-crema shadow-2xl transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between border-b-2 border-carbon/10 px-5 py-4">
          <p className="font-hand text-3xl">
            Tu carrito <span className="font-display text-base font-bold text-carbon-suave">({count})</span>
          </p>
          <button type="button" onClick={drawer.close} className="-mr-2 grid size-11 place-items-center rounded-full hover:bg-carbon/5" aria-label="Cerrar carrito">
            <CloseIcon className="size-6" />
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="grid flex-1 place-content-center gap-4 px-6 text-center">
            <p className="text-carbon-suave">Tu carrito está vacío.</p>
            <Link href="/tienda" onClick={drawer.close} className="toon toon-press rounded-full bg-estrella px-6 py-3 text-sm font-bold">
              Ver la tienda
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y-2 divide-carbon/10 overflow-y-auto px-5">
              {lines.map((l) => (
                <CartLineItem key={lineKey(l)} line={l} compact onNavigate={drawer.close} />
              ))}
            </ul>
            <div className="grid gap-3 border-t-2 border-carbon/10 px-5 py-4">
              <p className="flex justify-between font-bold">
                <span>Subtotal</span>
                <span className="tabular-nums">{formatCOP(cartSubtotal(lines))}</span>
              </p>
              <p className="-mt-2 text-xs text-carbon-suave">El envío se suma al pagar.</p>
              <Link
                href={checkoutEnabled ? "/checkout" : "/carrito"}
                onClick={drawer.close}
                className="toon toon-press rounded-full bg-estrella px-6 py-3 text-center text-sm font-bold"
              >
                {checkoutEnabled ? "Ir a pagar" : "Ver carrito"}
              </Link>
              {checkoutEnabled && (
                <Link href="/carrito" onClick={drawer.close} className="text-center text-sm font-semibold underline-offset-4 hover:underline">
                  Ver carrito
                </Link>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
