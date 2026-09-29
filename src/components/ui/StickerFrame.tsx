import type { CSSProperties, ReactNode } from "react";

// Formas del brand board: arco (oliva), píldora (cielo), círculo (sello arena) y rectángulo (velita lavanda).
const shapes = {
  // Radio exacto (50% ancho / 40% alto = medio ancho en 4:5): con rounded-t-full CSS aplastaría los radios de abajo
  arco: "rounded-tl-[50%_40%] rounded-tr-[50%_40%] rounded-b-[1.5rem] aspect-[4/5]",
  circulo: "rounded-full aspect-square",
  pildora: "rounded-full aspect-[8/5]",
  rectangulo: "rounded-[1.25rem] aspect-[3/4]",
} as const;

type Props = {
  shape: keyof typeof shapes;
  /** Clase de fondo (color de marca) */
  tint: string;
  className?: string;
  style?: CSSProperties;
  /** Hoy: un sticker ilustrado. Luego: la foto del producto con `fill` + `object-cover`. */
  children: ReactNode;
};

export function StickerFrame({ shape, tint, className = "", style, children }: Props) {
  return (
    <div
      className={`sticker-frame grid place-items-center overflow-hidden ${shapes[shape]} ${tint} ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}
