"use client";

import Image from "next/image";
import { useState } from "react";
import type { ProductImage } from "@/lib/catalog/types";

/** Foto grande + miniaturas. Sin fotos, el padre muestra el ícono de la categoría. */
export function Gallery({ images, name }: { images: ProductImage[]; name: string }) {
  const [index, setIndex] = useState(0);
  const current = images[index] ?? images[0];

  return (
    <div className="grid gap-3">
      <div className="toon toon-shadow relative aspect-square overflow-hidden rounded-[1.75rem] bg-crema-claro">
        <Image
          key={current.url}
          src={current.url}
          alt={current.alt}
          fill
          priority
          sizes="(min-width: 1024px) 560px, 100vw"
          className="object-cover"
        />
      </div>
      {images.length > 1 && (
        <ul className="flex gap-2 overflow-x-auto pb-1" aria-label={`Fotos de ${name}`}>
          {images.map((img, i) => (
            <li key={img.url} className="shrink-0">
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Ver foto ${i + 1}`}
                aria-pressed={i === index}
                className={`relative block size-16 cursor-pointer overflow-hidden rounded-xl border-2 sm:size-20 ${i === index ? "border-carbon" : "border-carbon/20"}`}
              >
                <Image src={img.url} alt="" fill sizes="80px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
