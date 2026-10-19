"use client";

import { useEffect } from "react";
import { cart } from "@/lib/cart/store";

/** Vacía el carrito cuando el pedido quedó pagado. */
export function ClearCart() {
  useEffect(() => cart.clear(), []);
  return null;
}
