import type { CSSProperties } from "react";

/** Ícono de línea de la marca (/public/brand/icon-*.svg) que toma el color del texto. */
export function BrandIcon({ src, className = "" }: { src: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`brand-mask inline-block ${className}`}
      style={{ maskImage: `url(${src})` } as CSSProperties}
    />
  );
}
