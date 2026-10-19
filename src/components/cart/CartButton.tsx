"use client";

import Link from "next/link";
import { BagIcon } from "@/components/ui/icons";
import { cartCount, useCart } from "@/lib/cart/store";

export function CartButton() {
  const count = cartCount(useCart());
  return (
    <Link
      href="/carrito"
      className="toon toon-press relative ml-1 grid size-11 place-items-center rounded-full bg-estrella"
      aria-label={`Carrito, ${count} ${count === 1 ? "producto" : "productos"}`}
    >
      <BagIcon className="size-5" strokeWidth={2.2} />
      <span
        aria-hidden="true"
        className="absolute -top-1.5 -right-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-carbon px-1 text-[0.6rem] font-bold text-crema tabular-nums"
      >
        {count > 99 ? "99+" : count}
      </span>
    </Link>
  );
}
