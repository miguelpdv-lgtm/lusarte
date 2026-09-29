import type { ReactNode } from "react";
import { BrandIcon } from "@/components/ui/BrandIcon";

type Props = {
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  id?: string;
};

// En línea con el texto: si el título ocupa dos líneas, los destellos quedan pegados a las palabras
const Sparkle = ({ side }: { side: "left" | "right" }) => (
  <BrandIcon
    src="/brand/icon-destello.svg"
    className={`h-[0.7em] w-[0.5em] -translate-y-[0.08em] align-middle text-carbon ${side === "left" ? "mr-[0.35em]" : "ml-[0.35em]"}`}
  />
);

/** Título de sección manuscrito, entre destellos de la marca. */
export function SectionHeading({ title, description, align = "center", id }: Props) {
  const centered = align === "center";
  return (
    <div className={centered ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <h2 id={id} className="font-hand text-[2rem] leading-tight text-balance sm:text-4xl lg:text-[2.75rem]">
        <Sparkle side="left" />
        {title}
        {centered && <Sparkle side="right" />}
      </h2>
      {description && <p className="mt-3 leading-relaxed text-carbon-suave sm:text-lg">{description}</p>}
    </div>
  );
}
